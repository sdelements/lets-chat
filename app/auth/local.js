var mongoose = require('mongoose'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    settings = require('./../config');

var enabled = settings.auth.local && settings.auth.local.enable;

function setup() {

    if (enabled) {

        passport.use(new LocalStrategy({
            usernameField: 'username',
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
                        message: 'Incorrect login credentials.'
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
    key: 'local',
    enabled: enabled,
    options: enabled ? settings.auth.local : null,
    setup: setup,
    authenticate: authenticate
};
