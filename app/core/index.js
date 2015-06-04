'use strict';

var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    _ = require('lodash'),
    AccountManager = require('./account'),
    AvatarCache = require('./avatar-cache'),
    FileManager = require('./files'),
    MessageManager = require('./messages'),
    PresenceManager = require('./presence'),
    RoomManager = require('./rooms'),
    UserManager = require('./users'),
    UserMessageManager = require('./usermessages');

function Core() {
    EventEmitter.call(this);

    this.account = new AccountManager({
        core: this
    });

    this.files = new FileManager({
        core: this
    });

    this.messages = new MessageManager({
        core: this
    });

    this.presence = new PresenceManager({
        core: this
    });

    this.rooms = new RoomManager({
        core: this
    });

    this.users = new UserManager({
        core: this
    });

    this.usermessages = new UserMessageManager({
        core: this
    });

    this.avatars = new AvatarCache({
        core: this
    });

    this.onAccountUpdated = this.onAccountUpdated.bind(this);

    this.on('account:update', this.onAccountUpdated);
}

util.inherits(Core, EventEmitter);

Core.prototype.onAccountUpdated = function(data) {
    var userId = data.user.id.toString();
    var user = this.presence.users.get(userId);

    if (!user) {
        return;
    }

    var new_data = {
        userId: userId,
        oldUsername: user.username,
        username: data.user.username
    };

    if (user) {
        _.assign(user, data.user, { id: userId });
    }

    if (data.usernameChanged) {
        // Emit to all rooms, that this user has changed their username
        this.presence.rooms.usernameChanged(new_data);
    }
};

module.exports = new Core();
