var _ = require('underscore'),
    express = require('express.io'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    passportSocketIo = require("passport.socketio");

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

function setupPassport(app, session) {

    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    }, function(identifier, password, done) {
        var User = mongoose.model('User');
        User.authenticate(identifier, password, function(err, user) {
            if (err) {
                return done(null, false,  {
                    message: 'Some fields did not validate.'
                });
            }
            if (user) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Incorrect password.' });
            }
        });
    }));

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

module.exports = {
    setupPassport: setupPassport
};
