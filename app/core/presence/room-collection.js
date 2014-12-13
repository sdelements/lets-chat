'use strict';

var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    _ = require('underscore'),
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

RoomCollection.prototype.getOrAdd = function(roomId) {
    roomId = roomId.toString();
    var room = this.rooms[roomId];
    if (!room) {
        room = this.rooms[roomId] = new Room(roomId);
        room.on('user_join', this.onJoin);
        room.on('user_leave', this.onLeave);
    }
    return room;
};

RoomCollection.prototype.onJoin = function(data) {
    this.emit('user_join', data);
};

RoomCollection.prototype.onLeave = function(data) {
    this.emit('user_leave', data);
};

RoomCollection.prototype.removeConnection = function(connection) {
    Object.keys(this.rooms).forEach(function(key) {
        this.rooms[key].removeConnection(connection);
    }, this);
};

module.exports = RoomCollection;
