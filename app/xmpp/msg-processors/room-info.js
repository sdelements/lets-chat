'use strict';

var MessageProcessor = require('./../msg-processor'),
    settings = require('./../../config');

module.exports = MessageProcessor.extend({

    if: function() {
        return this.toARoom &&
               this.ns['http://jabber.org/protocol/disco#info'];
    },

    then: function(cb) {
        var roomId = this.request.attrs.to.split('@')[0];

        this.core.rooms.get(roomId, function(err, room) {
            if (err) {
                return;
            }

            var stanza = this.Iq();

            var query = stanza.c('query', {
                xmlns:'http://jabber.org/protocol/disco#info'
            });

            query.c('identity', {
                category: 'conference',
                type: 'text',
                name: room.name
            });

            query.c('feature', {
                var: 'http://jabber.org/protocol/muc'
            });

            query.c('feature', {
                var: 'muc_open'
            });

            query.c('feature', {
                var: 'muc_unmoderated'
            });

            query.c('feature', {
                var: 'muc_nonanonymous'
            });

            cb(null, stanza);

        }.bind(this));
    }

});
