'use strict';

var util = require('util'),
    Connection = require('./../core/presence').Connection,
    settings = require('./../config');

function XmppConnection(user, client, jid) {
    Connection.call(this, 'xmpp', user);
    this.client = client;
    this._jid = jid;
    this.nicknames = {};
    client.conn = this;
    client.on('disconnect', this.disconnect.bind(this));
}

util.inherits(XmppConnection, Connection);

XmppConnection.prototype.disconnect = function() {
    this.emit('disconnect');

    if (this.client) {
        this.client.conn = null;
        this.client = null;
    }
};

XmppConnection.prototype.jid = function(room) {
    if (room) {
        return room + '@' + this.getConfDomain() +
               '/' + (this.nickname(room) || this._jid.local);
    }

    return this._jid.local + '@' + this.getDomain();
};

XmppConnection.prototype.nickname = function(room, value) {
    if (value) {
        this.nicknames[room] = value;
    }
    return this.nicknames[room];
};

XmppConnection.prototype.getDomain = function() {
    return this._jid.domain || settings.xmpp.domain;
};

XmppConnection.prototype.getConfDomain = function() {
    return 'conference.' + this.getDomain();
};

XmppConnection.prototype.getUserJid = function(username) {
    var domain = this.getDomain();

    if (username.indexOf('@' + domain) !== -1) {
        return username;
    }
    return username + '@' + domain;
};

XmppConnection.prototype.getRoomJid = function(roomId, username) {
    if (username && username === this.user.username) {
        return this.jid(roomId);
    }

    var jid = roomId + '@' + this.getConfDomain();
    if (username) {
        jid += '/' + username;
    }
    return jid;
};

XmppConnection.prototype.populateVcard = function(presence, user, core) {
    var vcard = presence.c('x', { xmlns: 'vcard-temp:x:update' });
    var photo = vcard.c('photo');

    var avatar = core.avatars.get(user.id);
    if (avatar) {
        photo.t(avatar.sha1);
    }
};

module.exports = XmppConnection;
