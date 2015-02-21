'use strict';

var _ = require('lodash'),
    mongoose = require('mongoose'),
    helpers = require('./helpers');

function MessageManager(options) {
    this.core = options.core;
}

MessageManager.prototype.create = function(options, cb) {
    var Message = mongoose.model('Message'),
        Room = mongoose.model('Room'),
        User = mongoose.model('User');

    Room.findById(options.room, function(err, room) {
        if (err) {
            console.error(err);
            return cb(err);
        }
        if (!room) {
            return cb('Room does not exist.');
        }
        if (room.archived) {
            return cb('Room is archived.');
        }
        Message.create(options, function(err, message) {
            if (err) {
                console.error(err);
                return cb(err);
            }
            // Touch Room's lastActive
            room.lastActive = message.posted;
            room.save();
            // Temporary workaround for _id until populate can do aliasing
            User.findOne(message.owner, function(err, user) {
                if (err) {
                    console.error(err);
                    return cb(err);
                }
                typeof cb === 'function' && cb(null, message, room, user);
                this.core.emit('messages:new', message, room, user);
            }.bind(this));
        }.bind(this));
    }.bind(this));
};

MessageManager.prototype.list = function(options, cb) {
    var Room = mongoose.model('Room');

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

    var Message = mongoose.model('Message'),
        User = mongoose.model('User');

    var find = Message.find({
        room: options.room
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

        if (_.includes(includes, 'room')) {
            find.populate('room', 'id name');
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

    Room.findById(options.room, function(err, room) {
        if (err) {
            console.error(err);
            return cb(err);
        }

        var opts = {
            userId: options.userId,
            password: options.password
        };

        room.canJoin(opts, function(err, canJoin) {
            if (err) {
                console.error(err);
                return cb(err);
            }

            if (!canJoin) {
                return cb(null, []);
            }

            find.limit(options.take)
                .exec(function(err, messages) {
                    if (err) {
                        console.error(err);
                        return cb(err);
                    }
                    cb(null, messages);
                });
        });
    });
};

module.exports = MessageManager;
