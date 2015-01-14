'use strict';

var Stanza = require('node-xmpp-core').Stanza,
    helper = require('./../helper'),
    EventListener = require('./../event-listener');

module.exports = EventListener.extend({

    on: 'messages:new',

    then: function(msg) {
        var connections = this.getConnectionsForRoom(msg.room.id);

        connections.forEach(function(connection) {

            var stanza = new Stanza.Message({
                id: msg._id,
                type: 'groupchat',
                to: helper.getRoomJid(msg.room.slug),
                from: helper.getRoomJid(msg.room.slug, msg.owner.username)
            });

            stanza.c('active', {
                xmlns: 'http://jabber.org/protocol/chatstates'
            });

            stanza.c('body').t(msg.text);

            this.send(connection, stanza);

        }, this);
    }

});
