'use strict';

var Stanza = require('node-xmpp-core').Stanza,
    helper = require('./../helper'),
    EventListener = require('./../event-listener');

var mentionPattern = /\B@(\w+)(?!@)\b/g;

module.exports = EventListener.extend({

    on: 'user-messages:new',

    then: function(msg, user, owner) {

        var connections = this.core.presence.connections.query({
            userId: user._id.toString(),
            type: 'xmpp'
        });

        connections.forEach(function(connection) {

            var stanza = new Stanza.Message({
                id: msg._id,
                type: 'chat',
                to: helper.getUserJid(user.username),
                from: helper.getUserJid(owner.username)
            });

            stanza.c('active', {
                xmlns: 'http://jabber.org/protocol/chatstates'
            });

            stanza.c('body').t(msg.text);

            this.send(connection, stanza);

        }, this);
    }

});
