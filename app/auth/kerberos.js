var _ = require('underscore'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    KerberosStrategy = require('passport-kerberos').Strategy,
    ldap = require('./ldap');

function Kerberos(options, core) {
    this.options = options;
    this.core = core;
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
                var opts = _.extend(this.options.ldap, {kerberos: true});
                return ldap.authorize(opts, this.core, username, done);

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
    this.core.account.create('kerberos', {
        uid: username,
        username: username,
        displayName: username,
        firstName: username,
        lastName: username,
        email: username + '@' + realm
    }, cb);
};

module.exports = Kerberos;
