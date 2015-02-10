var _ = require('lodash'),
    async = require('async'),
    express = require('express.oi'),
    cookieParser = require('cookie-parser'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    passportSocketIo = require('passport.socketio'),
    BearerStrategy = require('passport-http-bearer'),
    BasicStrategy = require('passport-http').BasicStrategy,
    settings = require('./../config'),
    providerSettings = {},
    MAX_AUTH_DELAY_TIME = 24 * 60 * 60 * 1000,
    loginAttempts = {},
    enabledProviders = [];

function getProviders(core) {
    return settings.auth.providers.map(function(key) {
        var Provider;

        if (key === 'local') {
            Provider = require('./local');
        } else {
            var pkgName = 'lets-chat-' + key;
            var pkg = require(pkgName);
            Provider = pkg && pkg.auth;
            if (!Provider) {
                throw 'Module "' + pkgName + '"" is not a auth provider';
            }
        }

        return new Provider(settings.auth[key], core);
    });
}

function setup(app, session, core) {

    enabledProviders = getProviders(core);

    enabledProviders.forEach(function(provider) {
        provider.setup();
        providerSettings[provider.key] = provider.options;
    });

    function tokenAuth(username, password, done) {
        if (!done) {
            done = password;
        }

        var User = mongoose.model('User');
        User.findByToken(username, function(err, user) {
            if (err) { return done(err); }
            if (!user) { return done(null, false); }
            return done(null, user);
        });
    }

    passport.use(new BearerStrategy(tokenAuth));
    passport.use(new BasicStrategy(tokenAuth));

    passport.serializeUser(function(user, done) {
        done(null, user._id);
    });

    passport.deserializeUser(function(id, done) {
        var User = mongoose.model('User');
        User.findOne({ _id: id }, function(err, user) {
            done(err, user);
        });
    });

    app.use(passport.initialize());
    app.use(passport.session());

    session = _.extend(session, {
        cookieParser: cookieParser,
        passport: passport
    });

    var psiAuth = passportSocketIo.authorize(session);

    app.io.use(function (socket, next) {
        var User = mongoose.model('User');
        if (socket.request._query && socket.request._query.token) {
            User.findByToken(socket.request._query.token, function(err, user) {
                if (err || !user) {
                    return next('Fail');
                }

                socket.request.user = user;
                socket.request.user.logged_in = true;
                socket.request.user.using_token = true;
                next();
            });
        } else {
            psiAuth(socket, next);
        }

    });
}

function checkIfAccountLocked(username, cb) {
    var attempt = loginAttempts[username];
    var isLocked = attempt &&
                   attempt.lockedUntil &&
                   attempt.lockedUntil > Date.now();

    cb(isLocked);
}

function wrapAuthCallback(username, cb) {
    return function(err, user, info) {
        if (!err && !user) {

            if(!loginAttempts[username]) {
                loginAttempts[username] = {
                    attempts: 0,
                    lockedUntil: null
                };
            }

            var attempt = loginAttempts[username];

            attempt.attempts++;

            if (attempt.attempts >= settings.auth.throttling.threshold) {
                var lock = Math.min(5000 * Math.pow(2,(attempt.attempts - NO_DELAY_AUTH_ATTEMPTS), MAX_AUTH_DELAY_TIME));
                attempt.lockedUntil = Date.now() + lock;
                return cb(err, user, {
                    locked: true,
                    message: 'Account is locked.'
                });
            }

            return cb(err, user, info);

        } else {

            if(loginAttempts[username]) {
                delete loginAttempts[username];
            }
            cb(err, user, info);
        }
    };
}

function authenticate(username, password, cb) {
    username = username.toLowerCase();

    checkIfAccountLocked(username, function(locked) {
        if (locked) {
            return cb(null, null, {
                locked: true,
                message: 'Account is locked.'
            });
        }

        if (settings.auth.throttling &&
            settings.auth.throttling.enable) {
            cb = wrapAuthCallback(username, cb);
        }

        var req = {
            body: {
                username: username,
                password: password
            }
        };

        var series = enabledProviders.map(function(provider) {
            return function() {
                var args = Array.prototype.slice.call(arguments);
                var callback = args.slice(args.length - 1)[0];

                if (args.length > 1 && args[0]) {
                    return callback(null, args[0]);
                }

                provider.authenticate(req, function(err, user, info) {
                    if (err) {
                        return callback(err);
                    }
                    return callback(null, user);
                });
            };
        });

        async.waterfall(series, function(err, user) {
            cb(err, user);
        });
    });
}

module.exports = {
    setup: setup,
    authenticate: authenticate,
    providers: providerSettings
};
