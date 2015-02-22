'use strict';

var mongoose = require('mongoose'),
    _ = require('lodash'),
    bcrypt = require('bcryptjs'),
    helpers = require('./helpers');

function RoomManager(options) {
    this.core = options.core;
}

RoomManager.prototype.canJoin = function(options, cb) {
    var method = options.id ? 'get' : 'slug',
        roomId = options.id ? options.id : options.slug;

    this[method](roomId, function(err, room) {
        if (err) {
            return cb(err);
        }

        if (!room) {
            return cb();
        }

        room.canJoin(options, function(err, canJoin) {
            cb(err, room, canJoin);
        });
    });
};

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
        }

        if(room.hasPassword && !room.owner.equals(options.user.id)) {
            return cb('Only owner can change passworded room.');
        }

        room.name = options.name;
        // DO NOT UPDATE SLUG
        // room.slug = options.slug;
        room.description = options.description;

        if (room.hasPassword && options.password) {
            room.password = options.password;
        }

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
            this.core.emit('rooms:archive', room);

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
    } else {
        find.sort('-lastActive');
    }

    find.exec(function(err, rooms) {
        if (err) {
            return cb(err);
        }

        if (options.users) {
            rooms = _.map(rooms, function(room) {
                var users = [];

                // Better approach would be this,
                // but need to fix join/leave events:
                // var auth = room.isAuthorized(options.userId);

                if (!room.password) {
                    users = this.core.presence
                                .getUsersForRoom(room.id.toString());
                }

                room = room.toJSON();
                room.users = users;
                room.userCount = room.users.length;
                return room;
            }, this);

            if (!options.sort) {
                rooms = _.sortByAll(rooms, ['userCount', 'lastActive'])
                         .reverse();
            }
        }

        cb(null, rooms);

    }.bind(this));
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
