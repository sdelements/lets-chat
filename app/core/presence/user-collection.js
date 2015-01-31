'use strict';

var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    _ = require('lodash');

function UserCollection() {
    this.users = {};

    this.get = this.get.bind(this);
    this.getOrAdd = this.getOrAdd.bind(this);
    this.remove = this.remove.bind(this);
}

UserCollection.prototype.get = function(userId) {
    return this.users[userId];
};

UserCollection.prototype.getOrAdd = function(user) {
    user = typeof user.toJSON === 'function' ? user.toJSON() : user;
    var userId = user.id.toString();
    if (!this.users[userId]) {
        _.assign(user, { id: userId });
        this.users[userId] = user;
    }
    return this.users[userId];
};

UserCollection.prototype.remove = function(user) {
    user = typeof user.toJSON === 'function' ? user.toJSON() : user;
    var userId = typeof user === 'object' ? user.id.toString() : user;
    delete this.users[userId];
};

module.exports = UserCollection;
