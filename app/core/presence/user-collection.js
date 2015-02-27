'use strict';

var EventEmitter = require('events').EventEmitter,
    crypto = require('crypto'),
    http = require('http'),
    util = require('util'),
    _ = require('lodash');

function UserCollection() {
    EventEmitter.call(this);
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
        this.getAvatarFile(user, user2);
    }
    return this.users[userId];
};

UserCollection.prototype.remove = function(user) {
    user = typeof user.toJSON === 'function' ? user.toJSON() : user;
    var userId = typeof user === 'object' ? user.id.toString() : user;
    delete this.users[userId];
};

UserCollection.prototype.getAvatarFile = function(user, target) {
    var fs = require('fs');
    var url = 'http://www.gravatar.com/avatar/' + user.avatar + '?s=64';

    var request = http.get(url, function(response) {
        if (response.statusCode !== 200) {
            return;
        }

        var buffers = [];

        response.on('data', function(buffer) {
            buffers.push(buffer);
        });

        response.on('end', function() {
            var buffer = Buffer.concat(buffers);
            var image = buffer.toString('base64');

            target._image = {
                base64: buffer.toString('base64'),
                sha1: crypto.createHash('sha1').update(buffer).digest('hex')
            };

            this.emit('xmpp:avatar_ready', target);
        }.bind(this));
    }.bind(this));
};

module.exports = UserCollection;
