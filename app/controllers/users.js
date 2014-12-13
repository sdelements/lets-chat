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
    app.get('/users/:email', middlewares.requireLogin, function(req, res) {
        req.io.route('users:retrieve');
    });

    //
    // Sockets
    //
    app.io.route('users', {
        list: function(req, next) {
            var data = req.data || req.query;

            if (!data || !data.room) {
                User.find(function(err, users) {
                    if (err) {
                        console.log(err);
                        next(err);
                    }

                    req.io.respond(users);
                });

                return;
            }

            models.room.findById(data.room || null, function(err, room) {
                if (err) {
                   // TODO: can you create a default error handler?
                   // We have code like this all over the place.
                    console.error(err);
                    return;
                }

                if (!room) {
                    // Invalid room!
                    req.io.respond('This room does not exist', 404);
                    return;
                }

                var userIds = core.presence.rooms
                                  .getOrAdd(data.room).getUserIds();

                User.find({ _id: { $in: userIds } }, function(err, users) {
                    if (err) {
                        // Something bad happened
                        console.error(err);
                        req.io.respond(err, 400);
                        return;
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
            User.find({ email: req.params.email }, function (err, user) {
                if (err) {
                    console.error(err);
                    req.io.respond(err, 400);
                    return;
                }
                req.io.respond(user);
            });
        }
    });
};
