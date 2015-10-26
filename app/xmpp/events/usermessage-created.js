'use strict';

var Message = require('node-xmpp-server').Message,
    settings = require('./../../config'),
    EventListener = require('./../event-listener');

module.exports = EventListener.extend({

    on: 'user-messages:new',

    then: function(msg, user, owner, data) {
        if (!settings.private.enable) {
            return;
        }

        var connections = this.core.presence.system.connections.query({
            userId: user._id.toString(),
            type: 'xmpp'
        });

        connections.forEach(function(connection) {
            var id = msg._id;
            if (connection.user.username === user.username) {
                id = data && data.id || id;
            }

            var stanza = new Message({
                id: id,
                type: 'chat',
                to: connection.getUserJid(user.username),
                from: connection.getUserJid(owner.username)
            });

            stanza.c('active', {
                xmlns: 'http://jabber.org/protocol/chatstates'
            });

            stanza.c('body').t(msg.text);

            this.send(connection, stanza);

        }, this);
    }

});
