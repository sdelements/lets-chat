'use strict';

var mongoose = require('mongoose'),
    helpers = require('./helpers');

function RoomManager(options) {
    this.core = options.core;
}

RoomManager.prototype.create = function(options, cb) {
    var Room = mongoose.model('Room');
    Room.create(options, function(err, room) {
        if (err) {
            return cb(err);
        }

        if (cb) {
            room = room;
            cb(null, room);
            this.core.emit('rooms:new', room);
        }
    }.bind(this));
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
            return cb('Room does not exist.');
        } else if(!!room.password && !room.owner.equals(options.user.id)) {
            return cb('Only owner can change passworded room.');
        } else if(!!room.password && !options.password) {
            return cb('A passworded room can\'t become public.');
        }

        room.name = options.name;
        // DO NOT UPDATE SLUG
        // room.slug = options.slug;
        room.description = options.description;
        room.password = options.password;
        room.save(function(err, room) {
            if (err) {
                console.error(err);
                return cb(err);
            }
            room = room;
            cb(null, room);
            this.core.emit('rooms:update', room);

        }.bind(this));
    }.bind(this));
};

RoomManager.prototype.archive = function(roomId, cb) {
    var Room = mongoose.model('Room');

    Room.findById(roomId, function(err, room) {
        if (err) {
            // Oh noes, a bad thing happened!
            console.error(err);
            return cb(err);
        }

        if (!room) {
            return cb('Room does not exist.');
        }

        room.archived = true;
        room.save(function(err, room) {
            if (err) {
                console.error(err);
                return cb(err);
            }
            cb(null, room);
            this.core.emit('rooms:archived', room);

        }.bind(this));
    }.bind(this));
};

RoomManager.prototype.list = function(options, cb) {
    options = options || {};

    options = helpers.sanitizeQuery(options, {
        defaults: {
            take: 500
        },
        maxTake: 5000
    });

    var Room = mongoose.model('Room');

    var find = Room.find({ archived: { $ne: true }});

    if (options.skip) {
        find.skip(options.skip);
    }

    if (options.take) {
        find.limit(options.take);
    }

    if (options.sort) {
        var sort = options.sort.replace(',', ' ');
        find.sort(sort);
    }

    find.exec(cb);
};

RoomManager.prototype.get = function(identifier, cb) {
    var Room = mongoose.model('Room');
    Room.findOne({
        _id: identifier,
        archived: { $ne: true }
    }, cb);
};

RoomManager.prototype.slug = function(slug, cb) {
    var Room = mongoose.model('Room');
    Room.findOne({
        slug: slug,
        archived: { $ne: true }
    }, cb);
};

module.exports = RoomManager;
