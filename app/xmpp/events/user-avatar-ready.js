'use strict';

var _ = require('lodash'),
    Stanza = require('node-xmpp-core').Stanza,
    settings = require('./../../config'),
    helper = require('./../helper'),
    EventListener = require('./../event-listener');

module.exports = EventListener.extend({

    on: 'xmpp:avatar_ready',

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

        _.each(connections, function(x) {
            if (x.user.id === user.id) {
                return;
            }

            // Reannounce presence
            var presence = new Stanza.Presence({
                from: helper.getUserJid(user.username)
            });

            helper.populateVcard(presence, user);

            this.send(x, presence);
        }, this);
    }

});
