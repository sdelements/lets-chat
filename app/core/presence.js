'use strict';

var _ = require('lodash'),
    Connection = require('./presence/connection'),
    Room = require('./presence/room'),
    ConnectionCollection = require('./presence/connection-collection'),
    RoomCollection = require('./presence/room-collection'),
    UserCollection = require('./presence/user-collection');

function PresenceManager(options) {
    this.core = options.core;
    this.system = new Room({ system: true });
    this.connections = new ConnectionCollection();
    this.rooms = new RoomCollection();
    this.users = new UserCollection();
    this.rooms.on('user_join', this.onJoin.bind(this));
    this.rooms.on('user_leave', this.onLeave.bind(this));

    this.connect = this.connect.bind(this);
    this.getUserCountForRoom = this.getUserCountForRoom.bind(this);
    this.getUsersForRoom = this.getUsersForRoom.bind(this);

    this.users.on('xmpp:avatar_ready', function(user) {
        this.emit('xmpp:avatar_ready', user);
    }.bind(options.core));
}

PresenceManager.prototype.getUserCountForRoom = function(roomId) {
    var room = this.rooms.get(roomId);
    return room ? room.userCount : 0;
};

PresenceManager.prototype.getUsersForRoom = function(roomId) {
    var room = this.rooms.get(roomId);
    return room ? room.getUsers() : [];
};

PresenceManager.prototype.connect = function(connection) {
    this.system.addConnection(connection);
    this.core.emit('connect', connection);

    connection.user = this.users.getOrAdd(connection.user);

    connection.on('disconnect', function() {
        this.disconnect(connection);
    }.bind(this));
};

PresenceManager.prototype.disconnect = function(connection) {
    this.system.removeConnection(connection);
    this.core.emit('disconnect', connection);
    this.rooms.removeConnection(connection);
};

PresenceManager.prototype.join = function(connection, roomId, roomSlug) {
    var room = this.rooms.getOrAdd(roomId, roomSlug);
    room.addConnection(connection);
};

PresenceManager.prototype.leave = function(connection, roomId) {
    var room = this.rooms.get(roomId);
    if (room) {
        room.removeConnection(connection);
    }
};

PresenceManager.prototype.onJoin = function(data) {
    this.core.emit('presence:user_join', data);
};

PresenceManager.prototype.onLeave = function(data) {
    this.core.emit('presence:user_leave', data);
};

PresenceManager.Connection = Connection;
module.exports = PresenceManager;
