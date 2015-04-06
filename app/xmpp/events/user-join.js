'use strict';

var Stanza = require('node-xmpp-core').Stanza,
    EventListener = require('./../event-listener');

module.exports = EventListener.extend({

    on: 'presence:user_join',

    then: function(data) {
        var connections = this.getConnectionsForRoom(data.roomId);

        connections.forEach(function(connection) {
            var presence = new Stanza.Presence({
                to: connection.jid(data.roomSlug),
                from: connection.getRoomJid(data.roomSlug, data.username)
            });

            presence
            .c('x', {
                xmlns:'http://jabber.org/protocol/muc#user'
            })
            .c('item', {
                jid: connection.getUserJid(data.username),
                affiliation: 'none',
                role: 'participant'
            });

            this.send(connection, presence);
        }, this);
    }

});
