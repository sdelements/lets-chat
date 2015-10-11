//
// Account Controller
//

'use strict';

var _ = require('lodash'),
    fs = require('fs'),
    psjon = require('./../../package.json'),
    auth = require('./../auth/index'),
    path = require('path'),
    settings = require('./../config');

module.exports = function() {

    var app = this.app,
        core = this.core,
        middlewares = this.middlewares;

    core.on('account:update', function(data) {
        app.io.emit('users:update', data.user);
    });

    //
    // Routes
    //
    app.get('/', middlewares.requireLogin.redirect, function(req, res) {
        res.render('chat.html', {
            account: req.user,
            settings: settings,
            version: psjon.version
        });
    });

    app.get('/login', function(req, res) {
        var imagePath = path.resolve('media/img/photos');
        var images = fs.readdirSync(imagePath);
        var image = _.chain(images).filter(function(file) {
            return /\.(gif|jpg|jpeg|png)$/i.test(file);
        }).sample().value();
        res.render('login.html', {
            photo: image,
            auth: auth.providers
        });
    });

    app.get('/logout', function(req, res ) {
        req.session.destroy();
        res.redirect('/login');
    });

    app.post('/account/login', function(req) {
        req.io.route('account:login');
    });

    app.post('/account/register', function(req) {
        req.io.route('account:register');
    });

    app.get('/account', middlewares.requireLogin, function(req) {
        req.io.route('account:whoami');
    });

    app.post('/account/profile', middlewares.requireLogin, function(req) {
        req.io.route('account:profile');
    });

    app.post('/account/settings', middlewares.requireLogin, function(req) {
        req.io.route('account:settings');
    });

    app.post('/account/token/generate', middlewares.requireLogin, function(req) {
        req.io.route('account:generate_token');
    });

    app.post('/account/token/revoke', middlewares.requireLogin, function(req) {
        req.io.route('account:revoke_token');
    });

    //
    // Sockets
    //
    app.io.route('account', {
        whoami: function(req, res) {
            res.json(req.user);
        },
        profile: function(req, res) {
            var form = req.body || req.data,
                data = {
                    displayName: form.displayName || form['display-name'],
                    firstName: form.firstName || form['first-name'],
                    lastName: form.lastName || form['last-name']
                };

            core.account.update(req.user._id, data, function (err, user) {
                if (err) {
                    return res.json({
                        status: 'error',
                        message: 'Unable to update your profile.',
                        errors: err
                    });
                }

                if (!user) {
                    return res.sendStatus(404);
                }

                res.json(user);
            });
        },
        settings: function(req, res) {
            if (req.user.usingToken) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Cannot change account settings ' +
                             'when using token authentication.'
                });
            }

            var form = req.body || req.data,
                data = {
                    username: form.username,
                    email: form.email,
                    currentPassword: form.password ||
                        form['current-password'] || form.currentPassword,
                    newPassword: form['new-password'] || form.newPassword,
                    confirmPassowrd: form['confirm-password'] ||
                        form.confirmPassword
                };

            auth.authenticate(req, req.user.uid || req.user.username,
                              data.currentPassword, function(err, user) {
                if (err) {
                    return res.status(400).json({
                        status: 'error',
                        message: 'There were problems authenticating you.',
                        errors: err
                    });
                }

                if (!user) {
                    return res.status(401).json({
                        status: 'error',
                        message: 'Incorrect login credentials.'
                    });
                }

                core.account.update(req.user._id, data, function (err, user, reason) {
                    if (err || !user) {
                        return res.status(400).json({
                            status: 'error',
                            message: 'Unable to update your account.',
                            reason: reason,
                            errors: err
                        });
                    }
                    res.json(user);
                });
            });
        },
        generate_token: function(req, res) {
            if (req.user.usingToken) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Cannot generate a new token ' +
                             'when using token authentication.'
                });
            }

            core.account.generateToken(req.user._id, function (err, token) {
                if (err) {
                    return res.json({
                        status: 'error',
                        message: 'Unable to generate a token.',
                        errors: err
                    });
                }

                res.json({
                    status: 'success',
                    message: 'Token generated.',
                    token: token
                });
            });
        },
        revoke_token: function(req, res) {
            if (req.user.usingToken) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Cannot revoke token ' +
                             'when using token authentication.'
                });
            }

            core.account.revokeToken(req.user._id, function (err) {
                if (err) {
                    return res.json({
                        status: 'error',
                        message: 'Unable to revoke token.',
                        errors: err
                    });
                }

                res.json({
                    status: 'success',
                    message: 'Token revoked.'
                });
            });
        },
        register: function(req, res) {

            if (req.user ||
                !auth.providers.local ||
                !auth.providers.local.enableRegistration) {

                return res.status(403).json({
                    status: 'error',
                    message: 'Permission denied'
                });
            }

            var fields = req.body || req.data;

            // Sanity check the password
            var passwordConfirm = fields.passwordConfirm || fields.passwordconfirm || fields['password-confirm'];

            if (fields.password !== passwordConfirm) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Password not confirmed'
                });
            }

            var data = {
                provider: 'local',
                username: fields.username,
                email: fields.email,
                password: fields.password,
                firstName: fields.firstName || fields.firstname || fields['first-name'],
                lastName: fields.lastName || fields.lastname || fields['last-name'],
                displayName: fields.displayName || fields.displayname || fields['display-name']
            };

            core.account.create('local', data, function(err) {
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
                    return res.status(400).json({
                        status: 'error',
                        message: message
                    });
                }

                res.status(201).json({
                    status: 'success',
                    message: 'You\'ve been registered, ' +
                             'please try logging in now!'
                });
            });
        },
        login: function(req, res) {
            auth.authenticate(req, function(err, user, info) {
                if (err) {
                    return res.status(400).json({
                        status: 'error',
                        message: 'There were problems logging you in.',
                        errors: err
                    });
                }

                if (!user && info && info.locked) {
                    return res.status(403).json({
                        status: 'error',
                        message: info.message || 'Account is locked.'
                    });
                }

                if (!user) {
                    return res.status(401).json({
                        status: 'error',
                        message: info && info.message ||
                                 'Incorrect login credentials.'
                    });
                }

                req.login(user, function(err) {
                    if (err) {
                        return res.status(400).json({
                            status: 'error',
                            message: 'There were problems logging you in.',
                            errors: err
                        });
                    }
                    var temp = req.session.passport;
                    req.session.regenerate(function(err) {
                        if (err) {
                            return res.status(400).json({
                                status: 'error',
                                message: 'There were problems logging you in.',
                                errors: err
                            });
                        }
                        req.session.passport = temp;
                        res.json({
                            status: 'success',
                            message: 'Logging you in...'
                        });
                    });
                });
            });
        }
    });
};
