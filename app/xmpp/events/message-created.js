'use strict';

var Message = require('node-xmpp-server').Message,
    EventListener = require('./../event-listener');

var mentionPattern = /\B@(\w+)(?!@)\b/g;

module.exports = EventListener.extend({

    on: 'messages:new',

    then: function(msg, room, user, data) {
        var connections = this.getConnectionsForRoom(room._id);

        connections.forEach(function(connection) {
            var text = msg.text;

            var mentions = msg.text.match(mentionPattern);

            if (mentions && mentions.indexOf('@' + connection.user.username) > -1) {
                text = connection.nickname(room.slug) + ': ' + text;
            }

            var id = msg._id;
            if (connection.user.username === user.username) {
                id = data && data.id || id;
            }

            var stanza = new Message({
                id: id,
                type: 'groupchat',
                to: connection.getRoomJid(room.slug),
                from: connection.getRoomJid(room.slug, user.username)
            });

            stanza.c('active', {
                xmlns: 'http://jabber.org/protocol/chatstates'
            });

            stanza.c('body').t(text);

            this.send(connection, stanza);

        }, this);
    }

});
