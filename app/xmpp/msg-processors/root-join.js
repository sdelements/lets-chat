'use strict';

var _ = require('lodash'),
    moment = require('moment'),
    Stanza = require('node-xmpp-core').Stanza,
    MessageProcessor = require('./../msg-processor'),
    settings = require('./../../config'),
    helper = require('./../helper');

module.exports = MessageProcessor.extend({

    if: function() {
        return !this.request.to &&
               !this.request.type &&
               this.request.name === 'presence';
    },

    then: function(cb) {
        var msgs = [];

        var users = this.core.presence.system.connections.getUsers({
            type: 'xmpp' // Only XMPP supports private messaging - for now
        });

        _.each(users, function(user) {
            if (user.id === this.connection.user.id) {
                return;
            }


            var presence = this.Presence({
                from: helper.getUserJid(user.username),
                type: undefined
            });

            msgs.push(presence);

        }, this);

        cb(null, msgs);
    }

});
