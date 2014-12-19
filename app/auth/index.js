var _ = require('underscore'),
    express = require('express.io'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    passportSocketIo = require("passport.socketio"),
    settings = require('./../config'),
    localAuth = require('./local'),
    kerberosAuth = require('./kerberos'),
    ldapAuth = require('./ldap');

function middleware(req, res, next) {
    // Let's make sure req.user is always populated

    next = next || res; // No res object if called as a socket.io middleware

    if (!req.user && req.handshake && req.handshake.user) {
        req.user = req.handshake.user;
    }

    if (!req.user) {
        return next();
    }

    if (!req.handshake || req.handshake.user) {
        req.handshake = req.handshake || {};
        req.handshake.user = req.user;
    }

    if (!req.session || !req.session.userID) {
        req.session = req.session || {};
        req.session.userID = req.user._id;
    }

    next();
}

function setup(app, session) {

    localAuth.setup();
    kerberosAuth.setup();
    ldapAuth.setup();

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

    if (settings.auth.kerberos && settings.auth.kerberos.enable) {
        kerberosAuth.authenticate(req, cb);
    }

    if (settings.auth.ldap && settings.auth.ldap.authenticate) {
        ldapAuth.authenticate(req, cb);
    }

    if (settings.auth.local && settings.auth.local.enable) {
        localAuth.authenticate(req, cb);
    }
}

module.exports = {
    setup: setup,
    authenticate: authenticate
};
