//
// Rooms Controller
//

'use strict';

var _ = require('lodash'),
    settings = require('./../config').rooms;

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

            if (data.roomHasPassword) {
                app.io.to(data.roomId).emit('users:join', user);
            } else {
                app.io.emit('users:join', user);
            }
        });
    });

    core.on('presence:user_leave', function(data) {
        User.findById(data.userId, function (err, user) {
            user = user.toJSON();
            user.room = data.roomId;

            if (data.roomHasPassword) {
                app.io.to(data.roomId).emit('users:leave', user);
            } else {
                app.io.emit('users:leave', user);
            }
        });
    });

    core.on('rooms:new', function(room) {
        app.io.emit('rooms:new', room);
    });

    core.on('rooms:update', function(room) {
        app.io.emit('rooms:update', room);
    });

    core.on('rooms:archive', function(room) {
        app.io.emit('rooms:archive', room);
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
            var options = {
                    userId: req.user._id,
                    users: req.param('users'),

                    skip: req.param('skip'),
                    take: req.param('take')
                };

            core.rooms.list(options, function(err, rooms) {
                if (err) {
                    console.error(err);
                    return res.status(400).json(err);
                }

                res.json(rooms);
            });
        },
        get: function(req, res) {
            var roomId = req.param('room') || req.param('id');

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
            var options = {
                owner: req.user._id,
                name: req.param('name'),
                slug: req.param('slug'),
                description: req.param('description'),
                password: req.param('password')
            };

            if(!settings.passwordProtected) {
                delete options.password;
            }

            core.rooms.create(options, function(err, room) {
                if (err) {
                    console.error(err);
                    return res.status(400).json(err);
                }

                res.status(201).json(room);
            });
        },
        update: function(req, res) {
            var roomId = req.param('room') || req.param('id');

            var options = {
                    name: req.param('name'),
                    slug: req.param('slug'),
                    description: req.param('description'),
                    password: req.param('password'),
                    user: req.user
                };

            core.rooms.update(roomId, options, function(err, room) {
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
        archive: function(req, res) {
            var roomId = req.param('room') || req.param('id');

            core.rooms.archive(roomId, function(err, room) {
                if (err) {
                    console.log(err);
                    return res.sendStatus(400);
                }

                if (!room) {
                    return res.sendStatus(404);
                }

                res.sendStatus(204);
            });
        },
        join: function(req, res) {
            var options = {
                id: req.param('roomId'),
                userId: req.user._id,
                password: req.param('password'),
                saveMembership: true
            };

            core.rooms.canJoin(options, function(err, room, canJoin) {
                if (err) {
                    console.error(err);
                    return res.sendStatus(400);
                }

                if (!room) {
                    return res.sendStatus(404);
                }

                if(!canJoin) {
                    return res.status(403).json({
                        status: 'error',
                        message: 'password required',
                        errors: 'password required'
                    });
                }

                var user = req.user.toJSON();
                user.room = room._id;

                core.presence.join(req.socket.conn, room);
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
            var roomId = req.param('room');

            core.rooms.get(roomId, function(err, room) {
                if (err) {
                    console.error(err);
                    return res.sendStatus(400);
                }

                if (!room) {
                    return res.sendStatus(404);
                }

                var users = core.presence.rooms
                        .getOrAdd(room)
                        .getUsers()
                        .map(function(user) {
                            // TODO: Do we need to do this?
                            user.room = room.id;
                            return user;
                        });

                res.json(users);
            });
        }
    });
};
