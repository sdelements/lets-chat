'use strict';

var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    mongoose = require('mongoose');


function AccountManager(options) {
    EventEmitter.call(this);
    this.core = options.core;
}

util.inherits(AccountManager, EventEmitter);

AccountManager.prototype.update = function(id, options, cb) {
    var User = mongoose.model('User');

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
            if (options.username) {
                user.username = options.username;
            }
            if (options.password) {
                user.password = options.password;
            }
        }
        
        user.save(cb);
    });
};

module.exports = AccountManager;
