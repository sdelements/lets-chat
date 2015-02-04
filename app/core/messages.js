'use strict';

var _ = require('lodash'),
    mongoose = require('mongoose');

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
                cb(null, message, room, user);
                this.core.emit('messages:new', message, room, user);
            }.bind(this));
        }.bind(this));
    }.bind(this));
};

MessageManager.prototype.list = function(options, cb) {
    var Message = mongoose.model('Message'),
        User = mongoose.model('User');

    var find = Message.find();

    if (options.room) {
        find.where('room', options.room);
    }

    if (options.since_id) {
        find.where('_id').gt(options.since_id);
    }

    if (options.since) {
        find.where('posted').gt(options.since);
    }

    if (options.include) {
        var includes = options.include.split(',');

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

    find.limit(options.take || 500)
        .sort({ 'posted': -1 })
        .exec(function(err, messages) {
            if (err) {
                console.error(err);
                return cb(err);
            }
            cb(null, messages);
        });
};

module.exports = MessageManager;
