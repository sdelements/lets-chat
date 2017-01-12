'use strict';

var Message = require('node-xmpp-server').Message,
    EventListener = require('./../event-listener');

module.exports = EventListener.extend({

    on: 'rooms:update',

    then: function(room) {
        var connections = this.getConnectionsForRoom(room._id);

        connections.forEach(function(connection) {

            var message = new Message({
                to: connection.jid(room.slug),
                from: connection.jid(room.slug),
                type: 'groupchat'
            });

            message.c('subject').t(room.name + ' | ' + room.description);

            this.send(connection, message);

        }, this);
    }

});
