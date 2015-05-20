'use strict';

var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    _ = require('lodash');

function UserCollection(options) {
    EventEmitter.call(this);
    this.core = options.core;
    this.users = {};

    this.get = this.get.bind(this);
    this.getOrAdd = this.getOrAdd.bind(this);
    this.remove = this.remove.bind(this);
}

util.inherits(UserCollection, EventEmitter);

UserCollection.prototype.get = function(userId) {
    return this.users[userId];
};

UserCollection.prototype.getByUsername = function(username) {
    return _.find(this.users, function(user) {
        return user.username === username;
    });
};

UserCollection.prototype.getOrAdd = function(user) {
    var user2 = typeof user.toJSON === 'function' ? user.toJSON() : user;
    var userId = user2.id.toString();
    if (!this.users[userId]) {
        _.assign(user2, { id: userId });
        this.users[userId] = user2;
        this.core.avatars.add(user);
    }
    return this.users[userId];
};

UserCollection.prototype.remove = function(user) {
    user = typeof user.toJSON === 'function' ? user.toJSON() : user;
    var userId = typeof user === 'object' ? user.id.toString() : user;
    delete this.users[userId];
};

module.exports = UserCollection;
