'use strict';

var mongoose = require('mongoose');


function AccountManager(options) {
    this.core = options.core;
}

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

        if (user.local) {

            if (options.username && options.username !== user.username) {
                var xmppConns = this.core.presence.connections.query({
                    userId: user._id,
                    type: 'xmpp'
                });

                if (xmppConns.length) {
                    return cb('You can not change your username ' +
                    'with active XMPP sessions.');
                }

                usernameChange = true;
                user.username = options.username;
            }

            if (options.password) {
                user.password = options.password;
            }

        }

        user.save(function(err) {
            if (err) {
                return cb(err);
            }

            if (usernameChange) {
                this.core.emit('account:username_changed', {
                    userId: user._id.toString(),
                    username: user.username
                });
            }

            if (cb) {
                cb(null, user);
            }

        }.bind(this));
    }.bind(this));
};

module.exports = AccountManager;
