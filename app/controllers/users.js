//
// Users Controller
//

'use strict';

module.exports = function() {

    var _ = require('lodash');

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
        list: function(req, res) {
            var roomId = req.param('room');

            if (!roomId) {
                User.find(function(err, users) {
                    if (err) {
                        console.log(err);
                        return res.status(400).json(err);
                    }

                    res.json(users);
                });

                return;
            }

            models.room.findById(roomId || null, function(err, room) {
                if (err) {
                    console.error(err);
                    return res.status(400).json(err);
                }

                if (!room) {
                    // Invalid room!
                    return res.status(404).json('This room does not exist');
                }

                var userIds = core.presence.rooms
                                  .getOrAdd(room._id, room.slug).getUserIds();

                User.find({ _id: { $in: userIds } }, function(err, users) {
                    if (err) {
                        // Something bad happened
                        console.error(err);
                        return res.status(400).json(err);
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
        },
        retrieve: function(req, res) {
            var identifier = req.param('id');

            User.findByIdentifier(identifier, function (err, user) {
                if (err) {
                    console.error(err);
                    return res.status(400).json(err);
                }

                if (!user) {
                    return res.sendStatus(404);
                }

                res.json(user);
            });
        }
    });
};
