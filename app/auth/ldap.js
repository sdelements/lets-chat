var fs = require('fs'),
    _ = require('underscore'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    ldap = require('ldapjs'),
    LDAPStrategy = require('passport-ldapauth').Strategy,
    KerberosStrategy = require('passport-kerberos').Strategy;

function Ldap(options) {
    this.options = options;
    this.key = 'ldap';

    this.setup = this.setup.bind(this);
    this.getLdapStrategy = this.getLdapStrategy.bind(this);
}

Ldap.key = 'ldap';

Ldap.prototype.setup = function() {
    passport.use(this.getLdapStrategy());
};

Ldap.prototype.authenticate = function(req, cb) {
    passport.authenticate('ldapauth', cb)(req);
};

Ldap.prototype.getLdapStrategy = function() {
    return new LDAPStrategy(
        {
            server: {
                url: this.options.connect_settings.url,
                tlsOptions: this.options.connect_settings.tlsOptions,
                adminDn: this.options.bind_options.bindDN,
                adminPassword: this.options.bind_options.bindCredentials,
                searchBase: this.options.search.base,
                searchFilter: this.options.search.opts.filter,
                searchAttributes: this.options.search.opts.attributes,
                searchScope: this.options.search.opts.scope
            },
            usernameField: 'username',
            passwordField: 'password'
        },
        function (user, done) {
            return Ldap.findOrCreateFromLDAP(this.options, user, done);
        }.bind(this)
    );
};

Ldap.findOrCreateFromLDAP = function(options, ldapEntry, callback) {
    var User = mongoose.model('User');

    User.findOne({ uid: ldapEntry.uid }, function (err, user) {
        if (err) {
            return callback(err);
        }
        if (!user) {
            Ldap.createLdapUser(options, ldapEntry, callback);
        } else {
            return callback(null, user);
        }
    });
};

Ldap.createLdapUser = function(options, ldapEntry, callback) {
    var User = mongoose.model('User');
    var field_mappings = options.field_mappings;
    var data = {
        uid: ldapEntry[field_mappings.uid],
        username: ldapEntry[field_mappings.uid],
        email: ldapEntry[field_mappings.email],
        firstName: ldapEntry[field_mappings.firstName],
        lastName: ldapEntry[field_mappings.lastName],
        displayName: ldapEntry[field_mappings.displayName]
    };

    if (!data.displayName) {
        data.displayName = data.firstName + ' ' + data.lastName;
    }

    var user = new User(data);
    user.save(function (err, user) {
        if (err) {
            console.error(err);
            return callback(err);
        }
        return callback(null, user);
    });
};

//LDAP sanitization
Ldap.sanitizeLDAP = function(ldapString) {
    return ldapString.replace(/[*\(\)\\\u0000!&|:~]{1}/g, function (match) {
        var cleanChar = match.charCodeAt(0).toString(16);
        return '\\' + (cleanChar.length === 1 ? '0': '') + cleanChar;
    });
};

// LDAP Authorization for external providers (ie. Kerberos)
Ldap.authorize = function(ldap_options, username, done) {
    try {
        var options = {
            url: ldap_options.connect_settings.url,
            ca: fs.readFileSync(ldap_options.connect_settings.tlsOptions.ca)
        };

        var client = ldap.createClient(options);

        client.bind(ldap_options.bind_options.bindDN,
            ldap_options.bind_options.bindCredentials,
            function (err) {

            if (err) {
                console.error(err);
                return done(err);
            }

            var clientOpts = _.clone(ldap_options.search.opts);

            var filter = (clientOpts.filter || '')
                .replace(/{{username}}/g, Ldap.sanitizeLDAP(username));

            clientOpts.filter = filter;

            client.search(ldap_options.search.base,
                clientOpts,
                Ldap.getLdapSearchCallback(ldap_options, client, username, done));
        });
    } catch (err) {
        console.error(err);
        return done(err);
    }
};

Ldap.getLdapSearchCallback = function(options, client, username, done) {
    return function(err, res) {
        if (err) {
            console.error(err);
            return done(err);
        }

        var foundUsers = [];

        res.on('searchEntry', function (entry) {
            foundUsers.push(entry.object);
        });

        res.on('error', function (err) {
            if (err) {
                return done(err);
            }
        });

        res.on('end', function (result) {
            if (result.status !== 0) {
                var err = new Error('non-zero status from LDAP search: ' +
                result.status);
                return done(err);
            }

            switch (foundUsers.length) {
                case 0:
                    return done();
                case 1:
                    Ldap.findOrCreateFromLDAP(options, foundUsers[0], done);
                    break;
                default:
                    var error = new Error(format(
                        'unexpected number of matches (%s) for "%s" username',
                        foundUsers.length, username));
                    return done(error);
            }

            if (!options.connect_settings.maxConnections) {
                client.unbind();
            }
        });
    };
};

module.exports = Ldap;
