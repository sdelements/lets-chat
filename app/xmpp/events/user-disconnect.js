'use strict';

var _ = require('lodash'),
    Presence = require('node-xmpp-server').Presence,
    settings = require('./../../config'),
    EventListener = require('./../event-listener');

module.exports = EventListener.extend({

    on: 'disconnect',

    then: function(connection) {
        if (!settings.private.enable) {
            return;
        }

        if (connection.type !== 'xmpp') {
            return;
        }

        var existing = this.core.presence.system.connections.query({
            userId: connection.user.id,
            type: 'xmpp'
        });

        if (existing.length > 0) {
            // Still has other XMPP connections
            return;
        }

        var connections = this.core.presence.system.connections.query({
            type: 'xmpp'
        });

        _.each(connections, function(x) {
            if (x.user.id === connection.user.id) {
                return;
            }

            var presence = new Presence({
                to: x.jid(),
                from: x.getUserJid(connection.user.username),
                type: 'unavailable'
            });

            this.send(x, presence);

        }.bind(this));
    }

});
