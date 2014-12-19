//
// Account Controller
//

'use strict';

module.exports = function() {

    var _ = require('underscore'),
        fs = require('fs'),
        path = require('path');

    var app = this.app,
        middlewares = this.middlewares,
        models = this.models,
        User = models.user;

    //
    // Routes
    //
    app.get('/', middlewares.requireLogin, function(req, res) {
        res.render('chat.html', {
            account: req.user.toJSON()
        });
    });

    app.get('/login', function(req, res) {
        var imagePath = path.resolve('media/img/photos');
        var images = fs.readdirSync(imagePath);
        var image = _.chain(images).filter(function(file) {
            return /\.(gif|jpg|jpeg|png)$/i.test(file);
        }).sample().value();

        res.render('login.html', {
            photo: image
        });
    });

    app.post('/account/login', function(req, res) {
        req.io.route('account:login');
    });

    // TODO: you should be POST'ing to DELETE'ing this resource
    app.get('/account/logout', function(req, res) {
        req.io.route('account:logout');
    });

    app.post('/account/register', function(req, res) {
        req.io.route('account:register');
    });

    app.post('/account/profile', function(req, res) {
        req.io.route('account:profile');
    });

    app.post('/account/settings', function(req, res) {
        req.io.route('account:settings');
    });

    //
    // Sockets
    //
    app.io.route('account', {
        whoami: function(req) {
            req.io.respond(req.user);
        },
        profile: function(req) {
            var form = req.body;
            var profile = models.user.findOne({
                _id: req.user._id
            }).exec(function (err, user) {
                if (err) {
                    // fark
                    req.io.respond({
                        status: 'error',
                        message: 'Unable to update your profile.'
                    });
                    return;
                }
                _.each({
                    displayName: form['display-name'],
                    firstName: form['first-name'],
                    lastName: form['last-name']
                }, function(value, field) {
                    if (value && value.length > 0) {
                        user[field] = value;
                    }
                });
                user.save(function (err) {
                    if (err) {
                        req.io.respond({
                            status: 'error',
                            message: 'An error occurred while updating your profile.',
                            errors: err
                        });
                        return;
                    }

                    // tell dem sockets ya KNO
                    // TO DO ^^

                    req.io.respond({
                        status: 'success',
                        message: 'Your profile has been saved.'
                    });
                });
            });
        },
        settings: function(req) {
            var form = req.body;
            var user = models.user.findOne({
                _id: req.user.id
            }).exec(function (err, user) {
                if (err) {
                    req.io.respond({
                        status: 'error',
                        message: 'Unable to update your account.'
                    });
                    return;
                }
                _.each({
                    username: form['username'],
                    email: form['email']
                }, function (value, field) {
                    if (value && value.length > 0) {
                        user[field] = value;
                        console.log(value + ' and ' + field);
                    }
                });
                user.save(function (err) {
                    if (err) {
                        req.io.respond({
                            status: 'error',
                            message: 'An error occurred while updating your account.',
                            errors: err
                        });
                        return;
                    }

                    //tell da sockets ya no bruh
                    // to do ^^

                    req.io.respond({
                        status: 'success',
                        message: 'You account has been saved.'
                    });
                });
            });
        },
        register: function(req) {
            var fields = req.body || req.data;
            User.create({
                username: fields.username,
                email: fields.email,
                password: fields.password,
                firstName: fields.firstName || fields.firstname || fields['first-name'],
                lastName: fields.lastName || fields.lastname || fields['last-name'],
                displayName: fields.displayName || fields.displayname || fields['display-name']
            }, function(err, user) {
                // Did we get error?
                if (err) {
                    var message = 'Sorry, we could not process your request';
                    // User already exists
                    if (err.code === 11000) {
                        message = 'Email has already been taken';
                    }
                    // Invalid username
                    if (err.errors) {
                        message = _.map(err.errors, function(error) {
                            return error.message;
                        }).join(' ');
                    // If all else fails...
                    } else {
                        console.error(err);
                    }
                    // Notify
                    req.io.respond({
                        status: 'error',
                        message: message
                    }, 400);
                    return;
                }
                // AWWW YISSSSS!
                req.io.respond({
                    status: 'success',
                    message: 'You\'ve been registered, please try logging in now!'
                }, 201);
            });
        },
        login: function(req) {
            var fields = req.body || req.data;
            User.authenticate(fields.email, fields.password, function(err, user) {
                if (err) {
                    // Something bad
                    req.io.respond({
                        status: 'error',
                        message: 'An error occured while trying to log you in'
                    }, 400);
                    return;
                }
                if (user && user) {
                    // Hello user <3
                    req.session.userID = user._id;
                    req.session.save(function() {
                        req.io.respond({
                            status: 'success',
                            message: 'You\'ve been logged in!'
                        });
                    });
                    return;
                }
                // NOPE!
                req.io.respond({
                    status: 'error',
                    message: 'Could not log you in'
                }, 401);
            });
        },
        logout: function(req) {
            req.session.destroy();
            req.io.respond({
                status: 'succcess',
                message: 'Session deleted'
            }, 200);
        }
    });
};
