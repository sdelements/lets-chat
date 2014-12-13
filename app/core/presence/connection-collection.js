'use strict';

var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    _ = require('underscore');

function ConnectionCollection() {
    this.connections = {};

    this.get = this.get.bind(this);
    this.getUserIds = this.getUserIds.bind(this);

    this.add = this.add.bind(this);
    this.remove = this.remove.bind(this);
}

ConnectionCollection.prototype.get = function(connectionId) {
    return this.connections[connectionId];
};

ConnectionCollection.prototype.getUserIds = function() {
    var userIds = Object.keys(this.connections).map(function(key) {
        return this.connections[key].userId;
    }, this);

    return _.uniq(userIds);
};

ConnectionCollection.prototype.byType = function(type) {
    return Object.keys(this.connections).map(function(key) {
        return this.connections[key];
    }, this).filter(function(conn) {
        return conn.type === type;
    });
};

ConnectionCollection.prototype.add = function(connection) {
    this.connections[connection.id] = connection;
};

ConnectionCollection.prototype.remove = function(connection) {
    if (!connection) {
        return;
    }

    var connId = typeof connection === 'string' ? connection : connection.id;
    if (this.connections[connId]) {
        delete this.connections[connId];
        return true;
    } else {
        return false;
    }
};

module.exports = ConnectionCollection;
