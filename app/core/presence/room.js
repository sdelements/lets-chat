'use strict';

var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    _ = require('underscore'),
    ConnectionCollection = require('./connection-collection');

function Room(roomId, roomSlug) {
    EventEmitter.call(this);
    this.roomId = roomId;
    this.roomSlug = roomSlug;
    this.connections = new ConnectionCollection();

    this.getUserIds = this.getUserIds.bind(this);

    this.addConnection = this.addConnection.bind(this);
    this.removeConnection = this.removeConnection.bind(this);
}

util.inherits(Room, EventEmitter);

Room.prototype.getUserIds = function() {
    return this.connections.getUserIds();
};

Room.prototype.getScreenNames = function() {
    return this.connections.getScreenNames();
};

Room.prototype.addConnection = function(connection) {
    if (!connection) {
        console.error('Attempt to add an invalid connection was detected');
        return;
    }

    if (this.getUserIds().indexOf(connection.userId) === -1) {
        // User joining room
        this.emit('user_join', {
            roomId: this.roomId,
            roomSlug: this.roomSlug,
            userId: connection.userId,
            screenName: connection.screenName
        });
    }
    this.connections.add(connection);
};

Room.prototype.removeConnection = function(connection) {
    if (!connection) {
        console.error('Attempt to remove an invalid connection was detected');
        return;
    }

    if (this.connections.remove(connection)) {
        if (this.getUserIds().indexOf(connection.userId) === -1) {
            // Leaving room altogether
            this.emit('user_leave', {
                roomId: this.roomId,
                roomSlug: this.roomSlug,
                userId: connection.userId,
                screenName: connection.screenName
            });
        }
    }
};

module.exports = Room;
