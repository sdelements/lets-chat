//
// Let's Chat Sockets
//

var _ = require('underscore');
var hash = require('node_hash');
var moment = require('moment');
var connect = require('connect');
var cookie = require('cookie');
var connectSession = require('connect').middleware.session.Session;
var socketIO = require('socket.io');
var passportSocketIO = require('passport.socketio');

var models = require('./models/models.js');

//
// Chat
//
var ChatServer = function (config, server, sessionStore) {

    var self = this;

    self.config = config;

    this.rooms = {};

    // Moment Format
    moment.calendar.sameDay = 'LT';

    //
    // Listen
    //
    this.listen = function () {

        // Setup socket.io
        this.io = socketIO.listen(server);
        this.io.set('log level', 0);
        
        //
        // Authorization
        //
        this.io.set('authorization', passportSocketIO.authorize({
            sessionKey: 'express.sid',
            sessionStore:  sessionStore,
            sessionSecret: self.config.cookie_secret,
            fail: function(data, accept) {
                accept(null, false);
            },
            success: function(data, accept) {
                accept(null, true);
            }
        }));

        //
        // Connection
        //
        this.io.sockets.on('connection', function(client) {

            var userData = client.handshake.user || false;
            
            if (!userData) {
                //
                // Sessions be messin' up bro
                //
                return;
            }

            //
            // Assign Client Profile
            //
            client.set('profile', {
                cid: hash.md5(client.id),
                id: userData._id,
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                displayName: userData.displayName,
                joined: userData.joined,
                avatar: hash.md5(userData.email),
                status: userData.status
            });

            //
            // Who is me bro
            //
            client.on('user:whoami', function() {
                client.get('profile', function(err, profile) {
                    if (err) {
                        // Oh man
                        return;
                    }
                    profile.safeName = profile.displayName.replace(/\W/g, '');
                    client.emit('user:whoami', profile);
                });
            });

            //
            // Message History
            //
            client.on('room:messages:get', function(query) {
                var today = new Date()
                query.from = query.from || new Date(today).setDate(today.getDate() - 7)
                query.room = query.room || '';
                models.message.where('posted').gte(query.from)
                    .where('room').equals(query.room)
                    .sort({ posted: -1 }).populate('owner')
                    .limit(150)
                    .exec(function (err, docs) {
                        if (err) {
                            // Couldn't get message or something
                            return;
                        }
                        var messages = [];
                        if (docs) {
                            docs.forEach(function (message) {
                                messages.push({
                                    room: message.room,
                                    id: message._id,
                                    owner: message.owner._id,
                                    avatar: hash.md5(message.owner.email),
                                    name: message.owner.displayName,
                                    text: message.text,
                                    posted: message.posted,
                                    time: moment(message.posted).calendar()
                                });
                            });
                        }
                        messages.reverse();
                        client.emit('room:messages:new', messages);
                });
            });

            //
            // New Message
            //
            client.on('room:messages:new', function(data) {
                var message = new models.message({
                    room: data.room,
                    owner: userData._id,
                    text: data.text
                });
                message.save(function(err, message) {
                    if (err) {
                        // Shit we're on fire!
                        return;
                    }
                    var outgoingMessage = {
                        id: message._id,
                        owner: message.owner,
                        avatar: hash.md5(userData.email),
                        name: userData.displayName,
                        text: message.text,
                        posted: message.posted,
                        time: moment(message.posted).calendar(),
                        room: message.room
                    }
                    self.io.sockets.in(message.room).emit('room:messages:new', outgoingMessage);
                    // Let's save the last message timestamp for the room
                    // TODO: Maybe define a helper in the Room schema
                    models.room.findOne({
                        '_id': message.room
                    }, function(err, room) {
                        if (err) {
                            // Shit son...
                            return;
                        }
                        room.lastActive = message.posted;
                        room.save();
                        self.io.sockets.emit('room:update', {
                            id: room._id,
                            lastActive: room.lastActive
                        });
                    });
                });
            });

            //
            // Join Room
            //
            client.on('room:join', function(id, fn) {
                models.room.findById(id, function(err, room) {
                    if (err) {
                        // Oh shit
                        return;
                    }
                    if (!room) {
                        // No room bro
                        return;
                    }
                    client.join(id);
                    // Send back Room meta to client
                    fn({
                        id: room._id,
                        name: room.name,
                        description: room.description
                    });
                    // Hey everyone, look who it is
                    client.get('profile', function(err, profile) {
                        if (err) {
                            // Oh shit
                            return;
                        }
                        var user = {
                            room: id,
                            id: profile.cid,
                            uid: profile.id,
                            avatar: profile.avatar,
                            name: profile.displayName,
                            status: profile.status,
                            safeName: profile.displayName.replace(/\W/g, '')
                        }
                        self.io.sockets.in(id).emit('room:users:new', user);
                        self.io.sockets.emit('rooms:users:new', user)
                    });
                });
            });

            //
            // Get Room Users
            //
            client.on('room:users:get', function(query) {
                _.each(self.io.sockets.clients(query.room), function(user) {
                    user.get('profile', function(err, profile) {
                        if (err) {
                            // What the what
                            return;
                        }
                        client.emit('room:users:new', {
                            room: query.room,
                            id: profile.cid,
                            uid: profile.id,
                            avatar: profile.avatar,
                            name: profile.displayName,
                            safeName: profile.displayName.replace(/\W/g, '')
                        });
                    });
                });

            });

            //
            // Get Room Files
            //
            client.on('room:files:get', function(query) {
                models.file.find({ room: query.room })
                  .populate('owner')
                  .exec(function (err, files) {
                        if (err) {
                            // Couldn't get files or something
                            return;
                        }
                        _.each(files, function(file) {
                            client.emit('room:files:new', {
                                url: '/files/' + file._id + '/' + encodeURIComponent(file.name),
                                id: file._id,
                                name: file.name,
                                type: file.type,
                                size: Math.floor(file.size / 1024),
                                uploaded: file.uploaded,
                                owner: file.owner.displayName,
                                room: file.room
                            });
                        });
                });
            });

            //
            // Create Room
            //
            client.on('rooms:create', function(room, fn) {
              var newroom = new models.room({
                name: room.name,
                description: room.description,
                owner: userData._id
              });
              newroom.save(function (err, room) {
                if (err) {
                  // We derped somehow
                  return;
                }
                self.io.sockets.emit('rooms:new', {
                    id: room._id,
                    name: room.name,
                    description: room.description,
                    owner: room.owner,
                    lastActive: room.lastActive
                });
              });
            });

            //
            // Roomlist request
            //
            client.on('rooms:get', function (query) {
                models.room.find().exec(function(err, rooms) {
                    if (err) {
                        // Couldn't get rooms
                        return;
                    }
                    _.each(rooms, function(room) {
                        client.emit('rooms:new', {
                            id: room._id,
                            name: room.name,
                            description: room.description,
                            owner: room.owner,
                            lastActive: room.lastActive
                        });
                         _.each(self.io.sockets.clients(room._id), function(user) {
                            user.get('profile', function(err, profile) {
                                if (err) {
                                    // What the what
                                    return;
                                }
                                client.emit('rooms:users:new', {
                                    room: room._id,
                                    id: profile.cid,
                                    uid: profile.id,
                                    avatar: profile.avatar,
                                    name: profile.displayName,
                                    safeName: profile.displayName.replace(/\W/g, '')
                                });
                            });
                        });
                    });
                });
            });

            //
            // Leave Room
            //
            client.on('room:leave', function(room) {
                var user = {
                    id: hash.md5(client.id),
                    room: room
                }
                self.io.sockets.in(room).emit('room:users:leave', user);
                self.io.sockets.emit('rooms:users:leave', user)
            });

            //
            // Update Room
            //
            client.on('room:update', function(data) {
                models.room.findOne({
                    _id: data.id
                }).exec(function (err, room) {
                    if (err) {
                        // Oh damn
                        return;
                    }
                    if (!room) {
                        // What happened to our room?
                        return;
                    }
                    room.name = data.name;
                    room.description = data.description;
                    room.save(function (err) {
                        if (err) {
                            // Couldn't save :(
                            return;
                        }
                        // Let's let everyone know
                        self.io.sockets.emit('room:update', {
                            id: room._id,
                            name: room.name,
                            description: room.description
                        });
                    });
                });
            });

            //
            // Delete Room
            //
            client.on('room:delete', function(id) {
                models.room.findOne({
                    _id: id
                }).exec(function (err, room) {
                    if (err) {
                        // Oh damn
                        return;
                    }
                    if (!room) {
                        // What happened to our room?
                        return;
                    }
                    self.io.sockets.in(id).emit('room:remove', id);
                    self.io.sockets.emit('rooms:remove', id)
                    room.remove();
                });
            });

            //
            // Disconnect
            //
            client.on('disconnect', function() {
                var rooms = self.io.sockets.manager.roomClients[client.id];
                _.each(rooms, function(status, room) {
                    room = room.replace('/', '');
                    var user = {
                        id: hash.md5(client.id),
                        room: room
                    }
                    self.io.sockets.in(room).emit('room:users:leave', user);
                    self.io.sockets.emit('rooms:users:leave', user)
                });
            });

        });

    };

    //
    // Utility method to send files from the express server
    //
    this.sendFile = function(file) {
        self.io.sockets.in(file.room).emit('room:files:new', file);
    };

    //
    // Utility method to update user profiles
    //
    this.updateUser = function(user) {
        self.io.sockets.emit('user:update', {
            id: user._id,
            name: user.displayName,
            avatar: hash.md5(user.email),
            safeName: user.displayName.replace(/\W/g, ''),
            status: user.status
        });
    };

    this.start = function () {
        // Setup listeners
        this.listen();
        return this;
    };

};

module.exports = ChatServer;
