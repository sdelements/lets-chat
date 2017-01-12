'use strict';

var _ = require('lodash'),
    Presence = require('node-xmpp-server').Presence,
    settings = require('./../../config'),
    EventListener = require('./../event-listener');

module.exports = EventListener.extend({

    on: 'avatar-cache:update',

    then: function(user) {
        if (!settings.private.enable) {
            return;
        }

        var user_connections = this.core.presence.system.connections.query({
            type: 'xmpp',
            userid: user.id
        });

        if (!user_connections.length) {
            // Don't publish presence for this user
            return;
        }

        var connections = this.core.presence.system.connections.query({
            type: 'xmpp'
        });

        _.each(connections, function(connection) {
            if (connection.user.id === user.id) {
                return;
            }

            // Reannounce presence
            var presence = new Presence({
                from: connection.getUserJid(user.username)
            });

            connection.populateVcard(presence, user, this.core);

            this.send(connection, presence);
        }.bind(this));
    }

});
