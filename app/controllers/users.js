//
// Users Controller
//

'use strict';

module.exports = function() {

    var _ = require('underscore');

    var app = this.app,
        core = this.core,
        middlewares = this.middlewares,
        models = this.models,
        User = models.user;

    //
    // Routes
    //
    app.get('/users', middlewares.requireLogin, function(req, res) {
        req.io.route('users:list');
    });

    app.get('/users/:id', middlewares.requireLogin, function(req, res) {
        req.io.route('users:get');
    });

    //
    // Sockets
    //
    app.io.route('users', {
        list: function(req) {
            var data = req.data || req.query;

            if (!data || !data.room) {
                User.find(function(err, users) {
                    if (err) {
                        console.log(err);
                        return req.io.respond(err, 400);
                    }

                    req.io.respond(users);
                });

                return;
            }

            models.room.findById(data.room || null, function(err, room) {
                if (err) {
                    console.error(err);
                    return req.io.respond(err, 400);
                }

                if (!room) {
                    // Invalid room!
                    return req.io.respond('This room does not exist', 404);
                }

                var userIds = core.presence.rooms
                                  .getOrAdd(room._id, room.slug).getUserIds();

                User.find({ _id: { $in: userIds } }, function(err, users) {
                    if (err) {
                        // Something bad happened
                        console.error(err);
                        return req.io.respond(err, 400);
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
        },
        retrieve: function(req) {
            var identifier = req.param('id');

            User.findByIdentifier(identifier, function (err, user) {
                if (err) {
                    console.error(err);
                    return req.io.respond(err, 400);
                }

                if (!user) {
                    return req.io.respond(404);
                }

                req.io.respond(user, 200);
            });
        }
    });
};
