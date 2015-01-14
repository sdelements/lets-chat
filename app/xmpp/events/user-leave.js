'use strict';

var Stanza = require('node-xmpp-core').Stanza,
    helper = require('./../helper'),
    EventListener = require('./../event-listener');

module.exports = EventListener.extend({

    on: 'presence:user_leave',

    then: function(data) {
        var connections = this.getConnectionsForRoom(data.roomId);

        connections.forEach(function(connection) {
            var presence = new Stanza.Presence({
                to: helper.getRoomJid(data.roomSlug, connection.username),
                from: helper.getRoomJid(data.roomSlug, data.username),
                type: 'unavailable'
            });

            var x = presence.c('x', {
                xmlns: 'http://jabber.org/protocol/muc#user'
            });
            x.c('item', {
                jid: helper.getRoomJid(data.roomSlug, data.username),
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
