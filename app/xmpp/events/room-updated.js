'use strict';

var Stanza = require('node-xmpp-core').Stanza,
    helper = require('./../helper'),
    EventListener = require('./../event-listener');

module.exports = EventListener.extend({

    on: 'rooms:update',

    then: function(room) {
        var connections = this.getConnectionsForRoom(room._id);

        connections.forEach(function(connection) {

            var message = new Stanza.Message({
                to: helper.getRoomJid(room.slug, connection.user.username),
                from: helper.getRoomJid(room.slug, connection.user.username),
                type: 'groupchat'
            });

            message.c('subject').t(room.name + ' | ' + room.description);

            this.send(connection, message);

        }, this);
    }

});
