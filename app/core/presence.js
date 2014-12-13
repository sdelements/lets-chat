'use strict';

var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    _ = require('underscore'),
    Connection = require('./presence/connection'),
    ConnectionCollection = require('./presence/connection-collection'),
    RoomCollection = require('./presence/room-collection');

function PresenceManager() {
    this.connections = new ConnectionCollection();
    this.rooms = new RoomCollection();

    this.connect = this.connect.bind(this);
}

PresenceManager.prototype.connect = function(connection) {
    this.connections.add(connection);

    connection.on('disconnect', function() {
        this.disconnect(connection);
    }.bind(this));
};

PresenceManager.prototype.disconnect = function(connection) {
    this.connections.remove(connection);
    this.rooms.removeConnection(connection);
};

PresenceManager.prototype.join = function(connection, roomId) {
    var room = this.rooms.getOrAdd(roomId);
    room.addConnection(connection);
};

PresenceManager.prototype.leave = function(connection, roomId) {
    var room = this.rooms.getOrAdd(roomId);
    room.removeConnection(connection);
};

PresenceManager.Connection = Connection;
module.exports = PresenceManager;
