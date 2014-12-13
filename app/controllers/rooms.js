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

    core.presence.rooms.on('user_join', function(data) {
        User.findById(data.userId, function (err, user) {
            user = user.toJSON();
            user.room = data.roomId;
            app.io.sockets.emit('users:join', user);
        });
    });

    core.presence.rooms.on('user_leave', function(data) {
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

    app.delete('/rooms', middlewares.requireLogin, function(req, res) {
        req.io.route('rooms:delete');
    });

    //
    // Sockets
    //
    app.io.route('rooms', {
        create: function(req) {
            var data = req.data || req.body,
                options = {
                    owner: req.user._id,
                    name: data.name,
                    description: data.description
                };

            core.rooms.create(options, function(err, room) {
                if (err) {
                    console.error(err);
                    req.io.respond(err, 400);
                    return;
                }
                req.io.respond(room, 201);
                app.io.broadcast('rooms:new', room);
            });
        },
        delete: function(req) {
            var data = req.data || req.body;
            var userId = req.user._id;
        },
        list: function(req) {
            core.rooms.list(null, function(err, rooms) {
                if (err) {
                    console.error(err);
                    req.io.respond(err, 400);
                    return;
                }
                req.io.respond(rooms);
            });
        },
        update: function(req) {
            var roomId = req.data.id,
                options = {
                    name: req.data.name,
                    description: req.data.description
                };

            core.rooms.update(roomId, options, function(err, room) {
                if (err || !room) {
                    req.io.respond(err, 400);
                    return;
                }
                req.io.broadcast('rooms:update', room.toJSON());
                req.io.respond(room.toJSON(), 200);
            });
        },
        join: function(req) {
            var roomId = req.data;
            core.rooms.get(roomId, function(err, room) {
                if (err) {
                    // Problem? TODO: Figure out how to recover?
                    console.error(err);
                    return;
                }
                if (!room) {
                    // No room, no effect
                    console.error('No room!');
                    req.io.respond();
                    return;
                }
                var user = req.user.toJSON();
                user.room = room._id;

                core.presence.join(req.socket.conn, room._id);
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
        }
    });
};
