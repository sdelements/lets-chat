'use strict';

var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    uuid = require('uuid');


function Connection(type, user) {
    EventEmitter.call(this);
    this.type = type;
    this.id = uuid.v4();
    this.user = user;
}

util.inherits(Connection, EventEmitter);

Connection.prototype.toJSON = function() {
    return {
        id: this.id,
        type: this.type,
        user: this.user
    };
};

module.exports = Connection;
