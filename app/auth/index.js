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
    providerSettings = {};

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

function authenticate(req, cb) {
    providers.some(function(provider) {
        if (provider.enabled) {
            provider.authenticate(req, cb);
            return true;
        }
        return false;
    });
}

module.exports = {
    setup: setup,
    authenticate: authenticate,
    providers: providerSettings
};
