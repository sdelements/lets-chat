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
    this.getScreenNames = this.getScreenNames.bind(this);
    this.containsUser = this.containsUser.bind(this);

    this.emitUserJoin = this.emitUserJoin.bind(this);
    this.emitUserLeave = this.emitUserLeave.bind(this);
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

Room.prototype.containsUser = function(userId) {
    return this.getUserIds().indexOf(userId) !== -1;
};

Room.prototype.emitUserJoin = function(data) {
    this.emit('user_join', {
        roomId: this.roomId,
        roomSlug: this.roomSlug,
        userId: data.userId,
        screenName: data.screenName
    });
};

Room.prototype.emitUserLeave = function(data) {
    this.emit('user_leave', {
        roomId: this.roomId,
        roomSlug: this.roomSlug,
        userId: data.userId,
        screenName: data.screenName
    });
};

Room.prototype.screenNameChanged = function(data) {
    if (this.containsUser(data.userId)) {
        // User leaving room
        this.emitUserLeave({
            userId: data.userId,
            screenName: data.oldScreenName
        });
        // User rejoining room with new screenName
        this.emitUserJoin({
            userId: data.userId,
            screenName: data.screenName
        });
    }
};

Room.prototype.addConnection = function(connection) {
    if (!connection) {
        console.error('Attempt to add an invalid connection was detected');
        return;
    }

    if (!this.containsUser(connection.userId)) {
        // User joining room
        this.emitUserJoin({
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
        if (!this.containsUser(connection.userId)) {
            // Leaving room altogether
            this.emitUserLeave({
                userId: connection.userId,
                screenName: connection.screenName
            });
        }
    }
};

module.exports = Room;
