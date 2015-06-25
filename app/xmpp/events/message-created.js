'use strict';

var Stanza = require('node-xmpp-core').Stanza,
    EventListener = require('./../event-listener');

var mentionPattern = /\B@(\w+)(?!@)\b/g;

module.exports = EventListener.extend({

    on: 'messages:new',

    then: function(msg, room, user) {
        var connections = this.getConnectionsForRoom(room._id);

        connections.forEach(function(connection) {
            var text = msg.text;

            var mentions = msg.text.match(mentionPattern);

            if (mentions && mentions.indexOf('@' + connection.user.username) > -1) {
                text = connection.nickname(room.slug) + ': ' + text;
            }

            var from = connection.getRoomJid(room.slug, user.username);
            if (connection.user.username === user.username) {
                from = connection._jid;
            }

            var stanza = new Stanza.Message({
                id: msg._id,
                type: 'groupchat',
                to: connection.getRoomJid(room.slug),
                from: from
            });

            stanza.c('active', {
                xmlns: 'http://jabber.org/protocol/chatstates'
            });

            stanza.c('body').t(text);

            this.send(connection, stanza);

        }, this);
    }

});
