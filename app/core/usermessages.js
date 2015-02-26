'use strict';

var _ = require('lodash'),
    mongoose = require('mongoose'),
    helpers = require('./helpers');

function UserMessageManager(options) {
    this.core = options.core;
}

// options.currentUser, options.user

UserMessageManager.prototype.create = function(options, cb) {
    var UserMessage = mongoose.model('UserMessage'),
        User = mongoose.model('User');

    User.findById(options.user, function(err, user) {
        if (err) {
            console.error(err);
            return cb(err);
        }
        if (!user) {
            return cb('User does not exist.');
        }

        var data = {
            users: [options.owner, options.user],
            owner: options.owner,
            text: options.text
        };

        UserMessage.create(data, function(err, message) {
            if (err) {
                console.error(err);
                return cb(err);
            }

            // Temporary workaround for _id until populate can do aliasing
            User.findOne(message.owner, function(err, owner) {
                if (err) {
                    console.error(err);
                    return cb(err);
                }
                typeof cb === 'function' && cb(null, message, user, owner);
                this.core.emit('user-messages:new', message, user, owner);
            }.bind(this));
        }.bind(this));
    }.bind(this));
};

UserMessageManager.prototype.list = function(options, cb) {
    options = options || {};

    if (!options.room) {
        return cb(null, []);
    }

    options = helpers.sanitizeQuery(options, {
        defaults: {
            reverse: true,
            take: 500
        },
        maxTake: 5000
    });

    var UserMessage = mongoose.model('Message'),
        User = mongoose.model('User');

    var find = UserMessage.find({
        users: { $all: [options.currentUser, options.user] }
    });

    if (options.since_id) {
        find.where('_id').gt(options.since_id);
    }

    if (options.from) {
        find.where('posted').gt(options.from);
    }

    if (options.to) {
        find.where('posted').lte(options.to);
    }

    if (options.expand) {
        var includes = options.expand.split(',');

        if (_.includes(includes, 'owner')) {
            find.populate('owner', 'id username displayName email avatar');
        }
    }

    if (options.skip) {
        find.skip(options.skip);
    }

    if (options.reverse) {
        find.sort({ 'posted': -1 });
    } else {
        find.sort({ 'posted': 1 });
    }

    find.limit(options.take)
        .exec(function(err, messages) {
            if (err) {
                console.error(err);
                return cb(err);
            }
            cb(null, messages);
        });
};

module.exports = UserMessageManager;
