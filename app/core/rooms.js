'use strict';

var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    mongoose = require('mongoose');


function RoomManager() {
    EventEmitter.call(this);
}

util.inherits(RoomManager, EventEmitter);

RoomManager.prototype.create = function(options, cb) {
    var Room = mongoose.model('Room');
    Room.create(options, function(err, room) {
        if (err) {
            cb(err);
            return;
        }

        if (cb) {
            room = room.toJSON();
            cb(null, room);
            this.emit('rooms:new', room);
        }
    });
};

RoomManager.prototype.update = function(roomId, options, cb) {
    var Room = mongoose.model('Room');

    Room.findById(roomId, function(err, room) {

        if (err) {
            // Oh noes, a bad thing happened!
            console.error(err);
            return cb(err);
        }
        if (!room) {
            // WHY IS THERE NO ROOM!?
            console.error('No room!');
            return cb(null, null);
        }

        room.name = options.name;
        // DO NOT UPDATE SLUG
        // room.slug = options.slug;
        room.description = options.description;
        room.save(function(err, room) {
            if (err) {
                console.error(err);
                return cb(err);
            }
            room = room.toJSON();
            cb(null, room);
            this.emit('rooms:update', room);
        });
    });
};

RoomManager.prototype.delete = function(id, cb) {
    var Room = mongoose.model('Room');
    Room.findByIdAndRemove(id, function(err, room) {
        if (err) {
            console.log(err);
            return cb(err);
        }
        if (!room) {
            // WHY NO ROOM?!!!!!
            console.log('No room!');
            return cb(null, null);
        }
        cb(null, room);
    });
}

RoomManager.prototype.list = function(options, cb) {
    var Room = mongoose.model('Room');
    Room
    .find()
    .exec(cb);
};

RoomManager.prototype.get = function(roomId, cb) {
    var Room = mongoose.model('Room');
    Room.findById(roomId, cb);
};

RoomManager.prototype.slug = function(slug, cb) {
    var Room = mongoose.model('Room');
    Room.findOne({slug: slug}, cb);
};

module.exports = RoomManager;
