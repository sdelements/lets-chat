//
// Letschatbro Chat Server
//

var _ = require('underscore');
var hash = require('node_hash');

var parseCookie = require('connect').utils.parseCookie;
var Session = require('connect').middleware.session.Session;

var models = require('./models/models.js');

var ChatServer = function (app, sessionStore) {

    var self = this;
    
    this.rooms = {};

    this.getUserlist = function(room) {
        var users = {};
        var clients = self.io.sockets.clients(room);
        clients.forEach(function(client) {
            client.get('profile', function(err, profile)  {
                if (err) {
                    // No profile?
                    return;
                }
                users[hash.md5(client.id)] = profile;
            });
        });
        return users;
    };

    this.listen = function () {

        this.io = require('socket.io').listen(app);
        this.io.set('log level', 0);

        this.io.set('authorization', function (data, accept) {
            // This function, courtesy of danielbaulig.de, will parse out session
            // info for connections.
            if (data.headers.cookie) {
                // if there is, parse the cookie
                data.cookie = parseCookie(data.headers.cookie);
                data.sessionID = data.cookie['express.sid'];
                data.sessionStore = sessionStore;
                sessionStore.get(data.sessionID, function (err, session) {
                    if (err || !session) {
                        accept('Error with Sessions', false);
                    } else {
                        data.session = new Session(data, session);
                        accept(null, true);
                    }
                });
            } else {
                // if there isn't, turn down the connection
                return accept('No cookie transmitted.', false);
            }
        });

        this.io.sockets.on('connection', function(client) {
        
            var hs = client.handshake;
            var userData = hs.session.user;
            
            client.set('profile', {
                cid: client.id,
                id: userData._id,
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                displayName: userData.displayName,
                joined: userData.joined,
                avatar: hash.md5(userData.email)
            });
            
            client.on('ping', function() {
                client.emit('ping');
            });
            
            client.on('room:join', function(room, fn) {
                client.join(room);
                client.get('profile', function(err, profile) {
                    var newuser = profile;
                    newuser.room = room;
                    self.io.sockets.in(room).emit('room:newuser', newuser);
                });
                // Send back Room meta
                models.room.findById(room, function (err, room) {
                    if (err) {
                        // Oh shit
                        return;
                    }
                    fn({
                        id: room._id,
                        name: room.name,
                        description: room.description,
                        users: self.getUserlist(room._id)
                    });
                });
            });
            /**
            client.on('room:meta', function(room) {
                models.room.findById(room, function (err, room) {
                    if (err) {
                        // Oh shit
                        return;
                    }
                    client.emit('room:meta', {
                        _id: room._id,
                        name: room.name,
                        description: room.description
                    });
                });
            });
            ***/
            
            client.on('room:userlist', function(room) {
                var users = self.getUserlist(room);
                var userlist = {
                    room: room,
                    users: users
                }
                client.emit('room:userlist', userlist);
            });
            
            client.on('room:history', function(room) {
                // Send room history
                var today = new Date()
                var yesterday = new Date(today).setDate(today.getDate() - 1)
                models.message.where('posted').gte(yesterday)
                    .where('room').equals(room)
                    .sort('posted', -1).populate('owner')
                    .exec(function (err, docs) {
                        var messages = [];
                        if (docs) {
                            docs.forEach(function (message) {
                                messages.push({
                                    id: message._id,
                                    owner: message.owner._id,
                                    avatar: hash.md5(message.owner.email),
                                    name: message.owner.displayName,
                                    text: message.text,
                                    posted: message.posted
                                });
                            });
                        }
                        messages.reverse();
                        client.emit('messages:history', messages)
                });
            });
            
            client.on('messages:add', function (data) {
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
                        posted: message.posted
                    }
                    self.io.sockets.in(message.room).emit('messages:new', outgoingMessage);
                });
            });

            client.on('session:get', function () {
                client.emit('session:user', {
                    id: userData._id,
                    displayName: userData.displayName,
                    firstName: userData.firstName,
                    lastName: userData.lastName
                });
            });

            client.on('disconnect', function () {
                self.io.sockets.emit('user:disconnect', {
                    'cid': client.id
                });
            });
            
        });
        
    };

    this.start = function () {

        // Populate Rooms
        models.room.find(function (err, rooms) {
            rooms.forEach(function (room) {
                self.rooms[room._id] = room;
            });
        });

        // Setup listeners
        this.listen();

		return this;

    };

};

module.exports = ChatServer;