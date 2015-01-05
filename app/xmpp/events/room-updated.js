'use strict';

var Stanza = require('node-xmpp-core').Stanza,
    helper = require('./../helper'),
    EventListener = require('./../event-listener');

module.exports = EventListener.extend({

    on: 'rooms:update',

    then: function(room) {
        var connections = this.getConnectionsForRoom(room.id);

        connections.forEach(function(connection) {

            var message = new Stanza.Message({
                to: helper.getRoomJid(room.slug, connection.screenName),
                from: helper.getRoomJid(room.slug, connection.screenName),
                type: 'groupchat'
            });

            message.c('subject').t(room.name);

            this.send(connection, message);

        }, this);
    }

});
