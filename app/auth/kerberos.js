var _ = require('underscore'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    KerberosStrategy = require('passport-kerberos').Strategy,
    ldap = require('./ldap');

function Kerberos(options) {
    this.options = options;
    this.key = 'kerberos';

    this.setup = this.setup.bind(this);
    this.getKerberosStrategy = this.getKerberosStrategy.bind(this);
    this.authenticate = this.authenticate.bind(this);
    this.getKerberosCallback = this.getKerberosCallback.bind(this);
    this.createSimpleKerberosUser = this.createSimpleKerberosUser.bind(this);
}

Kerberos.key = 'kerberos';

Kerberos.prototype.setup = function() {
    passport.use(this.getKerberosStrategy());
};

Kerberos.prototype.getKerberosStrategy = function() {
    return new KerberosStrategy(
        {
            usernameField: 'username',
            passwordField: 'password'
        },
        function (username, done) {
            return done(null, username);
        }
    );
};

Kerberos.prototype.authenticate = function(req, cb) {
    cb = this.getKerberosCallback(cb);
    passport.authenticate('kerberos', cb)(req);
};

Kerberos.prototype.getKerberosCallback = function(done) {
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

            if (this.options.use_ldap_authorization) {
                return ldap.authorize(this.options.ldap, username, done);

            } else {
                // Not using LDAP
                if (user) {
                    return done(null, user);
                } else {
                    this.createSimpleKerberosUser(username,
                        this.options.realm,
                        function(err, newUser) {
                        if (err) {
                            console.error(err);
                            return done(err);
                        }
                        return done(err, newUser);
                    });
                }
            }
        }.bind(this));
    }.bind(this);
};

Kerberos.prototype.createSimpleKerberosUser = function(username, realm, cb) {
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
};

module.exports = Kerberos;
