'use strict';

var Stanza = require('node-xmpp-core').Stanza,
    helper = require('./../helper'),
    EventListener = require('./../event-listener');

module.exports = EventListener.extend({

    on: 'rooms:archived',

    then: function(room) {
        var connections = this.getConnectionsForRoom(room.id);

        connections.forEach(function(connection) {
            // Kick connection from room!

            var presence = new Stanza.Presence({
                to: helper.getRoomJid(room.slug, connection.screenName),
                from: helper.getRoomJid(room.slug, connection.screenName),
                type: 'unavailable'
            });

            var x = presence
            .c('x', {
                xmlns:'http://jabber.org/protocol/muc#user'
            });

            x.c('item', {
                jid: helper.getRoomJid(room.slug, connection.screenName),
                affiliation: 'none',
                role: 'none'
            });

            x.c('destroy').c('reason').t('Room closed');

            this.send(connection, presence);

        }, this);
    }

});
