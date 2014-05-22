//
// Users Controller
//

module.exports = function() {
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
            models.user
                  .find()
                  .sort({'email': 1})
                  .exec(function(err, users) {
                // return all the users in the system
                if (err) {
                    // TODO: can you create a default error handler? We have code like
                    //       this all over the place.
                    console.error(err);
                    req.io.respond(err, 400);
                    return;
                }
                req.io.respond(users);
            });
        },
        retrieve: function(req) {
            var email = req.params.email;
            models.user.find({email: email}).exec(function (err, user) {
                if (err) {
                    console.error(err);
                    req.io.respond(err, 400);
                    return;
                }
                console.log(user);
                req.io.respond(user);
            });
        }
    });
}