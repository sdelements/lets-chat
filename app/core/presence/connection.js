'use strict';

var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    uuid = require('node-uuid');


function Connection(type, userId) {
    EventEmitter.call(this);
    this.type = type;
    this.id = uuid.v4();
    this.userId = userId.toString();
}

util.inherits(Connection, EventEmitter);

module.exports = Connection;
