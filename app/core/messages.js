'use strict';

var mongoose = require('mongoose');

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

    if (options.from) {
        find.where('_id').gt(options.from);
    }

    find
        .populate('owner', 'id username displayName email avatar')
        .populate('room', 'id name')
        .limit(options.limit || 500)
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
