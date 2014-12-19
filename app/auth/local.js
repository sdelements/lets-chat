var mongoose = require('mongoose'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    settings = require('./../config');

function setup() {

    if (settings.auth.local && settings.auth.local.enable) {

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
                    return done(null, false, {
                        message: 'Incorrect password.'
                    });
                }
            });
        }));

    }

}

function authenticate(req, cb) {
    passport.authenticate('local', cb)(req);
}

module.exports = {
    setup: setup,
    authenticate: authenticate
};
