'use strict';

var util = require('util'),
    Connection = require('./../core/presence').Connection;

function XmppConnection(userId, screenName, client) {
    Connection.call(this, 'xmpp', userId, screenName);
    this.client = client;
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

module.exports = XmppConnection;
