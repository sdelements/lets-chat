'use strict';

var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    AccountManager = require('./account'),
    MessageManager = require('./messages'),
    PresenceManager = require('./presence'),
    RoomManager = require('./rooms');

function Core() {
    EventEmitter.call(this);

    this.account = new AccountManager({
        core: this
    });

    this.messages = new MessageManager({
        core: this
    });

    this.presence = new PresenceManager({
        core: this
    });

    this.rooms = new RoomManager({
        core: this
    });

    this.onUsernameChanged = this.onUsernameChanged.bind(this);

    this.on('account:username_changed', this.onUsernameChanged);
}

util.inherits(Core, EventEmitter);

Core.prototype.onUsernameChanged = function(data) {
    var connections = this.presence.connections.query({
        userId: data.userId
    });

    if (!connections.length) {
        return;
    }

    var new_data = {
        userId: data.userId,
        oldScreenName: connections[0].screenName,
        screenName: data.username
    };

    // Update connections with new screenName
    connections.forEach(function(connection) {
        connection.screenName = new_data.screenName;
    });

    // Emit to all rooms, that this user has changed their screenName
    this.presence.rooms.screenNameChanged(new_data);
};

module.exports = new Core();
