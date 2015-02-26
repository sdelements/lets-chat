'use strict';

var _ = require('lodash'),
    Stanza = require('node-xmpp-core').Stanza,
    helper = require('./../helper'),
    EventListener = require('./../event-listener');

module.exports = EventListener.extend({

    on: 'disconnect',

    then: function(connection) {
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

            var presence = new Stanza.Presence({
                to: helper.getUserJid(x.user.username),
                from: helper.getUserJid(connection.user.username),
                type: 'unavailable'
            });

            this.send(x, presence);

        }, this);
    }

});
