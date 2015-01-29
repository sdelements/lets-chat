//
// Rooms Controller
//

'use strict';

var _ = require('lodash');

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
            app.io.emit('users:join', user);
        });
    });

    core.on('presence:user_leave', function(data) {
        User.findById(data.userId, function (err, user) {
            user = user.toJSON();
            user.room = data.roomId;
            app.io.emit('users:leave', user);
        });
    });


    //
    // Routes
    //
    app.route('/rooms')
        .all(middlewares.requireLogin)
        .get(function(req, res) {
            req.io.route('rooms:list');
        })
        .post(function(req, res) {
            req.io.route('rooms:create');
        });

    app.route('/rooms/:room')
        .all(middlewares.requireLogin, middlewares.roomRoute)
        .get(function(req, res) {
            req.io.route('rooms:get');
        })
        .put(function(req, res) {
            req.io.route('rooms:update');
        })
        .delete(function(req, res) {
            req.io.route('rooms:archive');
        });

    app.route('/rooms/:room/users')
        .all(middlewares.requireLogin, middlewares.roomRoute)
        .get(function(req, res) {
            req.io.route('rooms:users');
        });


    //
    // Sockets
    //
    app.io.route('rooms', {
        list: function(req, res) {
            core.rooms.list(null, function(err, rooms) {
                if (err) {
                    console.error(err);
                    return res.status(400).json(err);
                }

                if (req.data && req.data.userCounts) {
                    rooms = _.map(rooms, function(room) {
                        room = room.toJSON();
                        room.userCount =
                            core.presence.getUserCountForRoom(room.id);
                        return room;
                    });
                }

                res.json(rooms);
            });
        },
        get: function(req, res) {
            var roomId = req.data && req.data.id || req.param('room');

            core.rooms.get(roomId, function(err, room) {
                if (err) {
                    console.error(err);
                    return res.status(400).json(err);
                }

                if (!room) {
                    return res.sendStatus(404);
                }

                res.json(room);
            });
        },
        create: function(req, res) {
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
                    return res.status(400).json(err);
                }
                res.status(201).json(room);
                app.io.emit('rooms:new', room);
            });
        },
        update: function(req, res) {
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
                    return res.status(400).json(err);
                }

                if (!room) {
                    return res.sendStatus(404);
                }

                app.io.emit('rooms:update', room);
                res.json(room);
            });
        },
        archive: function(req, res) {
            // TODO: Make consitent with update method?
            var roomId = req.data && req.data.room ||
                         req.data && req.data.id || req.param('room'),
                data = req.data || req.body;

            core.rooms.archive(roomId, function(err, room) {
                if (err) {
                    console.log(err);
                    return res.sendStatus(400);
                }

                if (!room) {
                    return res.sendStatus(404);
                }

                res.json(room);
                app.io.emit('rooms:archive', room);
            });
        },
        join: function(req, res) {
            var roomId = req.data;
            core.rooms.get(roomId, function(err, room) {
                if (err) {
                    console.error(err);
                    return res.sendStatus(400);
                }

                if (!room) {
                    return res.sendStatus(400);
                }

                var user = req.user.toJSON();
                user.room = room._id;

                core.presence.join(req.socket.conn, room._id, room.slug);
                req.socket.join(room._id);
                res.json(room.toJSON());
            });
        },
        leave: function(req, res) {
            var roomId = req.data;
            var user = req.user.toJSON();
            user.room = roomId;

            core.presence.leave(req.socket.conn, roomId);
            req.socket.leave(roomId);
            res.json();
        },
        users: function(req, res) {
            var data = req.data || req.query;

            core.rooms.get(data.room, function(err, room) {
                if (err) {
                    console.error(err);
                    return res.sendStatus(400);
                }

                if (!room) {
                    return res.sendStatus(404);
                }

                var userIds = core.presence.rooms
                        .getOrAdd(room._id, room.slug).getUserIds();

                if (!userIds.length) {
                    return res.json([]);
                }

                User.find({ _id: { $in: userIds } }, function(err, users) {
                    if (err) {
                        // Something bad happened
                        console.error(err);
                        return res.sendStatus(400);
                    }

                    // The client needs user.room in
                    // order to properly route users
                    users = _.map(users, function(user) {
                        user = user.toJSON();
                        user.room = room.id;
                        return user;
                    });

                    res.json(users);
                });
            });
        }
    });
};
