'use strict';

var _ = require('lodash'),
    Stanza = require('node-xmpp-core').Stanza,
    settings = require('./../../config'),
    helper = require('./../helper'),
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
            var roster = new Stanza.Iq({
                id: connection.user.id,
                type: 'set',
                to: helper.getUserJid(x.user.username)
            });

            roster.c('query', {
                xmlns: 'jabber:iq:roster'
            }).c('item', {
                jid: helper.getUserJid(connection.user.username),
                name: connection.user.displayName,
                subscription: 'both'
            }).c('group').t('Friends');

            this.send(x, roster);


            // Announce presence
            var presence = new Stanza.Presence({
                to: helper.getUserJid(x.user.username),
                from: helper.getUserJid(connection.user.username)
            });

            this.send(x, presence);

        }, this);
    }

});
