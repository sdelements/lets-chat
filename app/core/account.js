'use strict';

var mongoose = require('mongoose');


function AccountManager(options) {
    this.core = options.core;
}

AccountManager.prototype.create = function(provider, options, cb) {
    var User = mongoose.model('User');
    var user = new User({ provider: provider });

    Object.keys(options).forEach(function(key) {
        user.set(key, options[key]);
    });

    user.save(cb);
};

AccountManager.prototype.update = function(id, options, cb) {
    var User = mongoose.model('User');
    var usernameChange = false;

    User.findById(id, function (err, user) {
        if (err) {
            return cb(err);
        }

        if (options.firstName) {
            user.firstName = options.firstName;
        }
        if (options.lastName) {
            user.lastName = options.lastName;
        }
        if (options.displayName) {
            user.displayName = options.displayName;
        }
        if (options.email) {
            user.email = options.email;
        }

        if (options.username && options.username !== user.username) {
            var xmppConns = this.core.presence.system.connections.query({
                userId: user._id,
                type: 'xmpp'
            });

            if (xmppConns.length) {
                return cb(null, null, 'You can not change your username ' +
                          'with active XMPP sessions.');
            }

            usernameChange = true;
            user.username = options.username;
        }

        if (user.local) {

            if (options.password || options.newPassword) {
                user.password = options.password || options.newPassword;
            }

        }

        user.save(function(err, user) {
            if (err) {
                return cb(err);
            }

            this.core.emit('account:update', {
                usernameChanged: usernameChange,
                user: user.toJSON()
            });

            if (cb) {
                cb(null, user);
            }

        }.bind(this));
    }.bind(this));
};

AccountManager.prototype.generateToken = function(id, cb) {
    var User = mongoose.model('User');

    User.findById(id, function (err, user) {
        if (err) {
            return cb(err);
        }

        user.generateToken(function(err, token) {
            if (err) {
                return cb(err);
            }

            user.save(function(err) {
                if (err) {
                    return cb(err);
                }

                cb(null, token);
            });
        });
    });
};

AccountManager.prototype.revokeToken = function(id, cb) {
    var User = mongoose.model('User');

    User.update({_id: id}, {$unset: {token: 1}}, cb);
};

module.exports = AccountManager;
