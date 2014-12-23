'use strict';

var AccountManager = require('./account'),
    MessageManager = require('./messages'),
    PresenceManager = require('./presence'),
    RoomManager = require('./rooms');

var core = {};

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

module.exports = core;
