var _ = require('underscore'),
    express = require('express.io'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    passportSocketIo = require("passport.socketio"),
    settings = require('./../config'),
    providers = [
        require('./local'),
        require('./kerberos'),
        require('./ldap')
    ],
    providerSettings = {},
    NO_DELAY_AUTH_ATTEMPTS = 3,
    MAX_AUTH_DELAY_TIME = 24 * 60 * 60 * 1000,
    loginAttempts = {};

function middleware(req, res, next) {
    // Let's make sure req.user is always populated

    next = next || res; // No res object if called as a socket.io middleware

    if (!req.user) {
        if (req.handshake && req.handshake.user) {
            req.user = req.handshake.user;
        }
    }

    next();
}

function setup(app, session) {

    providers.forEach(function(provider) {
        provider.setup();
        providerSettings[provider.key] = provider.options;
    });

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
        cookieParser: express.cookieParser,
        passport: passport
    });

    app.io.set('authorization', passportSocketIo.authorize(session));

    app.use(middleware);
    app.io.use(middleware);
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

            if (attempt.attempts >= NO_DELAY_AUTH_ATTEMPTS) {
                var lock = Math.min(5000 * Math.pow(2,(attempt.attempts - NO_DELAY_AUTH_ATTEMPTS), MAX_AUTH_DELAY_TIME));
                attempt.lockedUntil = Date.now() + lock;
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

function authenticate(req, cb) {
    checkIfAccountLocked(req.body.username, function(locked) {
        if (locked) {
            return cb(null, null, {
                message: 'Account is locked.'
            });
        }

        providers.some(function(provider) {
            if (provider.enabled) {
                cb = wrapAuthCallback(req.body.username, cb);
                provider.authenticate(req, cb);
                return true;
            }
            return false;
        });
    });
}

module.exports = {
    setup: setup,
    authenticate: authenticate,
    providers: providerSettings
};
