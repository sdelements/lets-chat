var _ = require('underscore'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    ldap = require('ldapjs'),
    KerberosStrategy = require('passport-kerberos').Strategy,
    ldap = require('./ldap'),
    settings = require('./../config'),
    kerberossettings = settings.auth.kerberos,
    ldapsettings = settings.auth.ldap;

function createSimpleKerberosUser(username, realm, cb) {
    var User = mongoose.model('User');
    var user = new User({
        uid: username,
        username: username,
        displayName: username,
        firstName: username,
        lastName: username,
        email: username + '@' + realm
    });
    user.save(cb);
}

function getKerberosStrategy() {
    return new KerberosStrategy(
        {
            usernameField: 'email',
            passwordField: 'password'
        },
        function (username, done) {
            return done(null, username);
        }
    );
}

function getKerberosCallback(done) {
    return function(err, username, info) {
        if (err) {
            return done(err);
        }

        if (!username) {
            // Authentication failed
            return done(err, username, info);
        }

        var User = mongoose.model('User');
        User.findOne({ uid: username }, function (err, user) {
            if (err) {
                return done(err);
            }

            if (ldapsettings.authorization) {
                // Using LDAP
                return ldap.authorize(username, done);

            } else {
                // Not using LDAP
                if (user) {
                    return done(null, user);
                } else {
                    createSimpleKerberosUser(username,
                        kerberossettings.realm,
                        function(err, newUser) {
                            if (err) {
                                console.error(err);
                                return done(err);
                            }
                            return done(err, newUser);
                        });
                    }
                }
            });
    };
}

function authenticate(req, cb) {

    if (settings.auth.kerberos && settings.auth.kerberos.enable) {
        cb = getKerberosCallback(cb);
        passport.authenticate('kerberos', cb)(req);
    }

}

function setup() {

    if (kerberossettings && kerberossettings.enable) {
        passport.use(getKerberosStrategy());
    }

}

module.exports = {
    setup: setup,
    authenticate: authenticate
};
