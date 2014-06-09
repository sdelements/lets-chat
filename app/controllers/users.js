//
// Users Controller
//

module.exports = function() {

    var _ = require('underscore');

    var app = this.app,
        middlewares = this.middlewares,
        models = this.models;

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
        list: function(req) {
            var data = req.data || req.query;
            models.room.findById(data.room || null, function(err, room) {
                if (err) {
                   // TODO: can you create a default error handler? We have code like
                   //       this all over the place.
                    console.error(err);
                    return;
                }
                if (!room) {
                    // Invalid room!
                    req.io.respond('This room does not exist', 404);
                    return;
                }
                // Distill the user ids from connected clients
                var ids = _.map(app.io.sockets.clients(room._id), function(client) {
                    return client.handshake.session.userID;
                });
                models.user.find({
                    _id: {
                        $in: ids
                    }
                }, function(err, users) {
                    if (err) {
                        // Something bad happened
                        console.error(err);
                        req.io.respond(err, 400);
                        return;
                    }
                    // The client needs user.room in 
                    // order to properly route users
                    var users = _.map(users, function(user) {
                        user = user.toJSON();
                        user.room = room.id
                        return user;
                    });
                    req.io.respond(users);
                });
            })
        },
        retrieve: function(req) {
            var email = req.params.email;
            models.user.find({email: email}).exec(function (err, user) {
                if (err) {
                    console.error(err);
                    req.io.respond(err, 400);
                    return;
                }
                req.io.respond(user);
            });
        }
    });
}