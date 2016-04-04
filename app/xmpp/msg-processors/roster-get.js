'use strict';

var _ = require('lodash'),
    MessageProcessor = require('./../msg-processor'),
    settings = require('./../../config');

module.exports = MessageProcessor.extend({

    if: function() {
        return this.request.type === 'get' && this.ns['jabber:iq:roster'];
    },

    then: function(cb) {
        if (!settings.private.enable) {
            return this.sendRoster([], cb);
        }

        if (settings.private.roster === 'all') {
            return this.sendAllUsers(cb);
        }

        this.sendOnlineUsers(cb);
    },

    sendOnlineUsers: function(cb) {
        var users = this.core.presence.system.connections.getUsers({
            type: 'xmpp' // Only XMPP supports private messaging - for now
        });

        this.sendRoster(users, cb);
    },

    sendAllUsers: function(cb) {
        this.core.users.list({}, function(err, users) {
            if (err) {
                return cb(err);
            }

            this.sendRoster(users, cb);
        }.bind(this));
    },

    sendRoster: function(users, cb) {
        var stanza = this.Iq();

        var v = stanza.c('query', {
            xmlns: 'jabber:iq:roster'
        });

        _.each(users, function(user) {
            if (user._id && user._id.equals(this.connection.user.id)) {
                return;
            }
            if (user.id && user.id === this.connection.user.id) {
                return;
            }

            v.c('item', {
                jid: this.connection.getUserJid(user.username),
                name: user.displayName,
                subscription: 'both'
            }).c('group').t('Let\'s Chat');
        }.bind(this));

        cb(null, stanza);
    }

});
