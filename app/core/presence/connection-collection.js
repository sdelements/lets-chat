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
    this.removeAll = this.removeAll.bind(this);
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

ConnectionCollection.prototype.getScreenNames = function() {
    var screenNames = Object.keys(this.connections).map(function(key) {
        return this.connections[key].screenName;
    }, this);

    return _.uniq(screenNames);
};

ConnectionCollection.prototype.query = function(options) {
    if (options.userId) {
        options.userId = options.userId.toString();
    }

    return Object.keys(this.connections).map(function(key) {
        return this.connections[key];
    }, this).filter(function(conn) {
        var result = true;

        if (options.userId && conn.userId !== options.userId) {
            result = false;
        }

        if (options.type && conn.type !== options.type) {
            result = false;
        }

        return result;

    });
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

ConnectionCollection.prototype.removeAll = function() {
    var keys = Object.keys(this.connections);

    keys.forEach(function(key) {
        delete this.connections[key];
    }, this);

    return true;
};

module.exports = ConnectionCollection;
