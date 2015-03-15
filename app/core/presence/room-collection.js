'use strict';

var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    _ = require('lodash'),
    Room = require('./room');

function RoomCollection() {
    EventEmitter.call(this);
    this.rooms = {};

    this.get = this.get.bind(this);
    this.getOrAdd = this.getOrAdd.bind(this);

    this.onJoin = this.onJoin.bind(this);
    this.onLeave = this.onLeave.bind(this);
}

util.inherits(RoomCollection, EventEmitter);

RoomCollection.prototype.get = function(roomId) {
    roomId = roomId.toString();
    return this.rooms[roomId];
};

RoomCollection.prototype.slug = function(slug) {
    return _.find(this.rooms, function(room) {
        return room.roomSlug === slug;
    });
};

RoomCollection.prototype.getOrAdd = function(room) {
    var roomId = room._id.toString();
    var pRoom = this.rooms[roomId];
    if (!pRoom) {
        pRoom = this.rooms[roomId] = new Room({
            room: room
        });
        pRoom.on('user_join', this.onJoin);
        pRoom.on('user_leave', this.onLeave);
    }
    return pRoom;
};

RoomCollection.prototype.onJoin = function(data) {
    this.emit('user_join', data);
};

RoomCollection.prototype.onLeave = function(data) {
    this.emit('user_leave', data);
};

RoomCollection.prototype.usernameChanged = function(data) {
    Object.keys(this.rooms).forEach(function(key) {
        this.rooms[key].usernameChanged(data);
    }, this);
};

RoomCollection.prototype.removeConnection = function(connection) {
    Object.keys(this.rooms).forEach(function(key) {
        this.rooms[key].removeConnection(connection);
    }, this);
};

module.exports = RoomCollection;
