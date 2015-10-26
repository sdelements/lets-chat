'use strict';

var Presence = require('node-xmpp-server').Presence,
    EventListener = require('./../event-listener');

module.exports = EventListener.extend({

    on: 'rooms:archived',

    then: function(room) {
        var connections = this.getConnectionsForRoom(room._id);

        connections.forEach(function(connection) {
            // Kick connection from room!

            var presence = new Presence({
                to: connection.jid(room.slug),
                from: connection.jid(room.slug),
                type: 'unavailable'
            });

            var x = presence
            .c('x', {
                xmlns: 'http://jabber.org/protocol/muc#user'
            });

            x.c('item', {
                jid: connection.jid(),
                affiliation: 'none',
                role: 'none'
            });

            x.c('destroy').c('reason').t('Room closed');

            this.send(connection, presence);

        }, this);
    }

});
