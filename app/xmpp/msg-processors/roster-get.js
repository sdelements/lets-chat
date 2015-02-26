'use strict';

var _ = require('lodash'),
    MessageProcessor = require('./../msg-processor'),
    settings = require('./../../config'),
    helper = require('./../helper');

module.exports = MessageProcessor.extend({

    if: function() {
        return this.request.type === 'get' && this.ns['jabber:iq:roster'];
    },

    then: function(cb) {
        var stanza = this.Iq();

        var v = stanza.c('query', {
            xmlns: 'jabber:iq:roster'
        });

        var users = this.core.users.list({}, function(err, users) {
            if (err) {
                return cb(err);
            }

            _.each(users, function(user) {
                if (user._id.equals(this.connection.user.id)) {
                    return;
                }

                v.c('item', {
                    jid: helper.getUserJid(user.username),
                    name: user.displayName,
                    subscription: 'both'
                }).c('group').t('Friends');
            }, this);

            cb(null, stanza);
        }.bind(this));
    }

});
