//
// Users Controller
//

'use strict';

module.exports = function() {

    var helpers = require('./../core/helpers');

    var app = this.app,
        middlewares = this.middlewares,
        models = this.models,
        User = models.user;

    //
    // Routes
    //
    app.get('/users', middlewares.requireLogin, function(req) {
        req.io.route('users:list');
    });

    app.get('/users/:id', middlewares.requireLogin, function(req) {
        req.io.route('users:get');
    });

    //
    // Sockets
    //
    app.io.route('users', {
        list: function(req, res) {
            var options = {
                    skip: req.param('skip'),
                    take: req.param('take')
                };

            options = helpers.sanitizeQuery(options, {
                defaults: {
                    take: 500
                },
                maxTake: 5000
            });

            var find = User.find();

            if (options.skip) {
                find.skip(options.skip);
            }

            if (options.take) {
                find.limit(options.take);
            }

            find.exec(function(err, users) {
                if (err) {
                    console.log(err);
                    return res.status(400).json(err);
                }

                res.json(users);
            });
        },
        get: function(req, res) {
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
