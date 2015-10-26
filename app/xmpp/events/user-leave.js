'use strict';

var Presence = require('node-xmpp-server').Presence,
    EventListener = require('./../event-listener');

module.exports = EventListener.extend({

    on: 'presence:user_leave',

    then: function(data) {
        var connections = this.getConnectionsForRoom(data.roomId);

        connections.forEach(function(connection) {
            var presence = new Presence({
                to: connection.jid(data.roomSlug),
                from: connection.getRoomJid(data.roomSlug, data.username),
                type: 'unavailable'
            });

            var x = presence.c('x', {
                xmlns: 'http://jabber.org/protocol/muc#user'
            });
            x.c('item', {
                jid: connection.getUserJid(data.username),
                role: 'none',
                affiliation: 'none'
            });
            x.c('status', {
                code: '110'
            });

            this.send(connection, presence);
        }, this);
    }

});
