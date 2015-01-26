//
// Rooms Controller
//

'use strict';

var _ = require('underscore');

module.exports = function() {
    var app = this.app,
        core = this.core,
        middlewares = this.middlewares,
        models = this.models,
        Room = models.room,
        User = models.user;

    core.on('presence:user_join', function(data) {
        User.findById(data.userId, function (err, user) {
            user = user.toJSON();
            user.room = data.roomId;
            app.io.sockets.emit('users:join', user);
        });
    });

    core.on('presence:user_leave', function(data) {
        User.findById(data.userId, function (err, user) {
            user = user.toJSON();
            user.room = data.roomId;
            app.io.sockets.emit('users:leave', user);
        });
    });


    //
    // Routes
    //
    app.get('/rooms', middlewares.requireLogin, function(req, res) {
        req.io.route('rooms:list');
    });

    app.post('/rooms', middlewares.requireLogin, function(req, res) {
        req.io.route('rooms:create');
    });

    app.get('/rooms/:room', middlewares.requireLogin, middlewares.roomRoute, function(req, res) {
        req.io.route('rooms:get');
    });

    app.put('/rooms/:room', middlewares.requireLogin, middlewares.roomRoute, function(req, res) {
        req.io.route('rooms:update');
    });

    app.delete('/rooms/:room', middlewares.requireLogin, middlewares.roomRoute, function(req, res) {
        req.io.route('rooms:archive');
    });

    app.get('/rooms/:room/users', middlewares.requireLogin, middlewares.roomRoute, function(req, res) {
        req.io.route('rooms:users');
    });


    //
    // Sockets
    //
    app.io.route('rooms', {
        list: function(req) {
            core.rooms.list(null, function(err, rooms) {
                if (err) {
                    console.error(err);
                    return req.io.status(400).respond(err);
                }
                req.io.respond(rooms);
            });
        },
        get: function(req) {
            var roomId = req.data && req.data.id || req.param('room');

            core.rooms.get(roomId, function(err, room) {
                if (err) {
                    console.error(err);
                    return req.io.status(400).respond(err);
                }

                if (!room) {
                    return req.io.sendStatus(404);
                }

                req.io.respond(room);
            });
        },
        create: function(req) {
            var data = req.data || req.body,
                options = {
                    owner: req.user._id,
                    name: data.name,
                    slug: data.slug,
                    description: data.description
                };

            core.rooms.create(options, function(err, room) {
                if (err) {
                    console.error(err);
                    return req.io.status(400).respond(err);
                }
                req.io.status(201).respond(room);
                app.io.broadcast('rooms:new', room);
            });
        },
        update: function(req) {
            var roomId = req.data && req.data.id || req.param('room'),
                data = req.data || req.body;

            var options = {
                    name: data.name,
                    slug: data.slug,
                    description: data.description
                };

            core.rooms.update(roomId, options, function(err, room) {
                if (err) {
                    console.error(err);
                    return req.io.status(400).respond(err);
                }

                if (!room) {
                    return req.io.sendStatus(404);
                }

                app.io.broadcast('rooms:update', room);
                req.io.respond(room);
            });
        },
        archive: function(req) {
            // TODO: Make consitent with update method?
            var roomId = req.data && req.data.room ||
                         req.data && req.data.id || req.param('room'),
                data = req.data || req.body;

            core.rooms.archive(roomId, function(err, room) {
                if (err) {
                    console.log(err);
                    return req.io.sendStatus(400);
                }

                if (!room) {
                    return req.io.sendStatus(404);
                }

                req.io.respond(room);
                app.io.broadcast('rooms:archive', room);
            });
        },
        join: function(req) {
            var roomId = req.data;
            core.rooms.get(roomId, function(err, room) {
                if (err) {
                    console.error(err);
                    return req.io.sendStatus(400);
                }

                if (!room) {
                    return req.io.sendStatus(400);
                }

                var user = req.user.toJSON();
                user.room = room._id;

                core.presence.join(req.socket.conn, room._id, room.slug);
                req.io.join(room._id);
                req.io.respond(room.toJSON());
            });
        },
        leave: function(req) {
            var roomId = req.data;
            var user = req.user.toJSON();
            user.room = roomId;

            core.presence.leave(req.socket.conn, roomId);
            req.io.leave(roomId);
            req.io.respond();
        },
        users: function(req) {
            var data = req.data || req.query;

            core.rooms.get(data.room, function(err, room) {
                if (err) {
                    console.error(err);
                    return req.io.sendStatus(400);
                }

                if (!room) {
                    return req.io.sendStatus(404);
                }

                var userIds = core.presence.rooms
                        .getOrAdd(room._id, room.slug).getUserIds();

                User.find({ _id: { $in: userIds } }, function(err, users) {
                    if (err) {
                        // Something bad happened
                        console.error(err);
                        return req.io.sendStatus(400);
                    }

                    // The client needs user.room in
                    // order to properly route users
                    users = _.map(users, function(user) {
                        user = user.toJSON();
                        user.room = room.id;
                        return user;
                    });

                    req.io.respond(users);
                });
            });
        }
    });
};
