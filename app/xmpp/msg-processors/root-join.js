'use strict';

var _ = require('lodash'),
    MessageProcessor = require('./../msg-processor'),
    settings = require('./../../config');

module.exports = MessageProcessor.extend({

    if: function() {
        return !this.request.to &&
               !this.request.type &&
               this.request.name === 'presence';
    },

    then: function(cb) {
        if (!settings.private.enable) {
            return cb();
        }

        var msgs = [];

        var users = this.core.presence.system.connections.getUsers({
            type: 'xmpp' // Only XMPP supports private messaging - for now
        });

        _.each(users, function(user) {
            if (user.id === this.connection.user.id) {
                return;
            }


            var presence = this.Presence({
                from: this.connection.getUserJid(user.username),
                type: undefined
            });

            this.connection.populateVcard(presence, user, this.core);

            msgs.push(presence);

        }.bind(this));

        cb(null, msgs);
    }

});
