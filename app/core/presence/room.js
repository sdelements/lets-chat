'use strict';

var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    _ = require('lodash'),
    ConnectionCollection = require('./connection-collection');

function Room(roomId, roomSlug) {
    EventEmitter.call(this);
    this.roomId = roomId;
    this.roomSlug = roomSlug;
    this.connections = new ConnectionCollection();
    this.userCount = 0;

    this.getUsers = this.getUsers.bind(this);
    this.getUserIds = this.getUserIds.bind(this);
    this.getUsernames = this.getUsernames.bind(this);
    this.containsUser = this.containsUser.bind(this);

    this.emitUserJoin = this.emitUserJoin.bind(this);
    this.emitUserLeave = this.emitUserLeave.bind(this);
    this.addConnection = this.addConnection.bind(this);
    this.removeConnection = this.removeConnection.bind(this);
}

util.inherits(Room, EventEmitter);

Room.prototype.getUsers = function() {
    return this.connections.getUsers();
};

Room.prototype.getUserIds = function() {
    return this.connections.getUserIds();
};

Room.prototype.getUsernames = function() {
    return this.connections.getUsernames();
};

Room.prototype.containsUser = function(userId) {
    return this.getUserIds().indexOf(userId) !== -1;
};

Room.prototype.emitUserJoin = function(data) {
    this.userCount++;
    this.emit('user_join', {
        roomId: this.roomId,
        roomSlug: this.roomSlug,
        userId: data.userId,
        username: data.username
    });
};

Room.prototype.emitUserLeave = function(data) {
    this.userCount--;
    this.emit('user_leave', {
        roomId: this.roomId,
        roomSlug: this.roomSlug,
        userId: data.userId,
        username: data.username
    });
};

Room.prototype.usernameChanged = function(data) {
    if (this.containsUser(data.userId)) {
        // User leaving room
        this.emitUserLeave({
            userId: data.userId,
            username: data.oldUsername
        });
        // User rejoining room with new username
        this.emitUserJoin({
            userId: data.userId,
            username: data.username
        });
    }
};

Room.prototype.addConnection = function(connection) {
    if (!connection) {
        console.error('Attempt to add an invalid connection was detected');
        return;
    }

    if (connection.user && connection.user.id &&
        !this.containsUser(connection.user.id)) {
        // User joining room
        this.emitUserJoin({
            userId: connection.user.id,
            username: connection.user.username
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
        if (connection.user && connection.user.id &&
            !this.containsUser(connection.user.id)) {
            // Leaving room altogether
            this.emitUserLeave({
                userId: connection.user.id,
                username: connection.user.username
            });
        }
    }
};

module.exports = Room;
