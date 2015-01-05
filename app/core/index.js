'use strict';

var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    AccountManager = require('./account'),
    MessageManager = require('./messages'),
    PresenceManager = require('./presence'),
    RoomManager = require('./rooms');

function Core() {
    EventEmitter.call(this);
}

util.inherits(Core, EventEmitter);

var core = new Core();

core.account = new AccountManager({
    core: core
});

core.messages = new MessageManager({
    core: core
});

core.presence = new PresenceManager({
    core: core
});

core.rooms = new RoomManager({
    core: core
});

core.account.on('username_changed', function(data) {
    var connections = core.presence.connections.query({
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
    core.presence.rooms.screenNameChanged(new_data);
});

module.exports = core;
