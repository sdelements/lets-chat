'use strict';

var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    mongoose = require('mongoose');


function MessageManager() {
    EventEmitter.call(this);
}

util.inherits(MessageManager, EventEmitter);

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

            // Temporary workaround for _id until populate can do aliasing
            User.findOne(message.owner, function(err, user) {
                if (err) {
                    console.error(err);
                    return cb(err);
                }
                message = message.toJSON();
                message.owner = user.toJSON();
                message.room = room.toJSON();
                cb(null, message);
                this.emit('messages:new', message);
            }.bind(this));
        }.bind(this));
    }.bind(this));
};

MessageManager.prototype.list = function(options, cb) {
    var Message = mongoose.model('Message'),
        User = mongoose.model('User');

    var find = Message.find({
        room: options.room || null
    });

    if (options.from) {
        find.where('_id').gt(options.from);
    }

    // This is why the terrorists hate us
    find
        .populate('owner', 'id username uid displayName email avatar')
        .limit(options.limit || 500)
        .sort({ 'posted': -1 })
        .exec(function(err, messages) {
            if (err) {
                console.error(err);
                return cb(err);
            }
            cb(null, messages.reverse());
        });
};

module.exports = MessageManager;
