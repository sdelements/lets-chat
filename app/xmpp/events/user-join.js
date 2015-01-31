'use strict';

var Stanza = require('node-xmpp-core').Stanza,
    helper = require('./../helper'),
    EventListener = require('./../event-listener');

module.exports = EventListener.extend({

    on: 'presence:user_join',

    then: function(data) {
        var connections = this.getConnectionsForRoom(data.roomId);

        connections.forEach(function(connection) {
            var presence = new Stanza.Presence({
                to: helper.getRoomJid(data.roomSlug, connection.user.username),
                from: helper.getRoomJid(data.roomSlug, data.username)
            });

            presence
            .c('x', {
                xmlns:'http://jabber.org/protocol/muc#user'
            })
            .c('item', {
                jid: helper.getUserJid(data.username),
                affiliation: 'none',
                role: 'participant'
            });

            this.send(connection, presence);
        }, this);
    }

});
