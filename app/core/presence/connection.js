'use strict';

var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    uuid = require('node-uuid');


function Connection(type, user) {
    EventEmitter.call(this);
    this.type = type;
    this.id = uuid.v4();
    this.user = user;
}

util.inherits(Connection, EventEmitter);

module.exports = Connection;
