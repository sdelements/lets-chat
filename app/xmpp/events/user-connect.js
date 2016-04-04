'use strict';

var _ = require('lodash'),
    IQ = require('node-xmpp-server').IQ,
    Presence = require('node-xmpp-server').Presence,
    settings = require('./../../config'),
    EventListener = require('./../event-listener');

module.exports = EventListener.extend({

    on: 'connect',

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

        if (existing.length > 1) {
            // Was already connected via XMPP
            return;
        }

        var connections = this.core.presence.system.connections.query({
            type: 'xmpp'
        });

        _.each(connections, function(x) {
            if (x.user.id === connection.user.id) {
                return;
            }

            // Update rosters
            var roster = new IQ({
                id: connection.user.id,
                type: 'set',
                to: x.jid()
            });

            roster.c('query', {
                xmlns: 'jabber:iq:roster'
            }).c('item', {
                jid: x.getUserJid(connection.user.username),
                name: connection.user.displayName,
                subscription: 'both'
            }).c('group').t('Let\'s Chat');

            this.send(x, roster);


            // Announce presence
            var presence = new Presence({
                from: x.getUserJid(connection.user.username)
            });

            x.populateVcard(presence, connection.user, this.core);

            this.send(x, presence);

        }.bind(this));
    }

});
