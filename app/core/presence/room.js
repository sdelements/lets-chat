'use strict';

var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    ConnectionCollection = require('./connection-collection');

function Room(options) {
    EventEmitter.call(this);

    if (options.system) {
        // This is the system room
        // Used for tracking what users are online
        this.system = true;
        this.roomId = undefined;
        this.roomSlug = undefined;
        this.hasPassword = false;
    } else {
        this.system = false;
        this.roomId = options.room._id.toString();
        this.roomSlug = options.room.slug;
        this.hasPassword = options.room.hasPassword;
    }

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

    var d = {
        userId: data.userId,
        username: data.username
    };

    if (this.system) {
        d.system = true;
    } else {
        d.roomId = this.roomId;
        d.roomSlug = this.roomSlug;
        d.roomHasPassword = this.hasPassword;
    }

    this.emit('user_join', d);
};

Room.prototype.emitUserLeave = function(data) {
    this.userCount--;

    var d = {
        user: data.user,
        userId: data.userId,
        username: data.username
    };

    if (this.system) {
        d.system = true;
    } else {
        d.roomId = this.roomId;
        d.roomSlug = this.roomSlug;
        d.roomHasPassword = this.hasPassword;
    }

    this.emit('user_leave', d);
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
            user: connection.user,
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
                user: connection.user,
                userId: connection.user.id,
                username: connection.user.username
            });
        }
    }
};

module.exports = Room;
