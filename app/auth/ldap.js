var fs = require('fs'),
    _ = require('underscore'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    ldap = require('ldapjs'),
    LDAPStrategy = require('passport-ldapauth').Strategy,
    KerberosStrategy = require('passport-kerberos').Strategy,
    settings = require('./../config'),
    kerberossettings = settings.auth.kerberos,
    ldapsettings = settings.auth.ldap,
    field_mappings = ldapsettings.field_mappings;

var enabled = settings.auth.ldap && settings.auth.ldap.authentication;

function createLdapUser(ldapEntry, callback) {
    var User = mongoose.model('User');
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
        if (kerberossettings.enabled) {
            return callback(null, user, kerberossettings.realm);
        } else {
            return callback(null, user);
        }
    });
}

function findOrCreateFromLDAP(ldapEntry, callback) {
    var User = mongoose.model('User');

    User.findOne({ uid: ldapEntry.uid }, function (err, user) {
        if (err) {
            return callback(err);
        }
        if (!user) {
            createLdapUser(ldapEntry, callback);
        } else {
            if (kerberossettings.enabled) {
                return callback(null, user, kerberossettings.realm);
            } else {
                return callback(null, user);
            }
        }
    });
}

//LDAP sanitization
function sanitizeLDAP(ldapString) {
    return ldapString.replace(/[*\(\)\\\u0000!&|:~]{1}/g, function (match) {
        var cleanChar = match.charCodeAt(0).toString(16);
        return '\\' + (cleanChar.length === 1 ? '0': '') + cleanChar;
    });
}

function getLdapSearchCallback(client, done) {
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
                    findOrCreateFromLDAP(foundUsers[0], done);
                    break;
                default:
                    var error = new Error(format(
                        'unexpected number of matches (%s) for "%s" username',
                        foundUsers.length, username));
                    return done(error);
            }

            if (!ldapsettings.connect_settings.maxConnections) {
                client.unbind();
            }
        });
    };
}

// LDAP Authorization for Kerberos
function authorize(username, done) {
    try {
        var options = {
            url: ldapsettings.connect_settings.url,
            ca: fs.readFileSync(ldapsettings.connect_settings.tlsOptions.ca)
        };

        var client = ldap.createClient(options);

        client.bind(ldapsettings.bind_options.bindDN,
                    ldapsettings.bind_options.bindCredentials,
                    function (err) {

            if (err) {
                console.error(err);
                return done(err);
            }

            var clientOpts = _.clone(ldapsettings.search.opts);

            var filter = (clientOpts.filter || '')
                .replace(/{{username}}/g, sanitizeLDAP(username));

            clientOpts.filter = filter;

            client.search(ldapsettings.search.base,
                          clientOpts,
                          getLdapSearchCallback(client, done));
        });
    } catch (err) {
        console.error(err);
        return done(err);
    }
}

function getLdapStrategy() {
    return new LDAPStrategy(
        {
            server: {
                url: ldapsettings.connect_settings.url,
                tlsOptions: ldapsettings.connect_settings.tlsOptions,
                adminDn: ldapsettings.bind_options.bindDN,
                adminPassword: ldapsettings.bind_options.bindCredentials,
                searchBase: ldapsettings.search.base,
                searchFilter: ldapsettings.search.opts.filter,
                searchAttributes: ldapsettings.search.opts.attributes,
                searchScope: ldapsettings.search.opts.scope
            },
            usernameField: 'username',
            passwordField: 'password'
        },
        function (user, done) {
            return findOrCreateFromLDAP(user, done);
        }
    );
}

function authenticate(req, cb) {
    if (enabled) {
        passport.authenticate('ldapauth', cb)(req);
    }
}

function setup() {
    if (enabled) {
        passport.use(getLdapStrategy());
    }
}

module.exports = {
    key: 'ldap',
    enabled: enabled,
    options: enabled ? ldapsettings : null,
    setup: setup,
    authenticate: authenticate,
    authorize: authorize
};
