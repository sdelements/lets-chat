'use strict';

var MessageManager = require('./messages'),
    PresenceManager = require('./presence'),
    RoomManager = require('./rooms');

module.exports = {
    presence: new PresenceManager(),
    messages: new MessageManager(),
    rooms: new RoomManager()
};
