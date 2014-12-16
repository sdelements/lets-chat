'use strict';

var MessageProcessor = require('./../msg-processor'),
    settings = require('./../../config'),
    helper = require('./../helper');

module.exports = MessageProcessor.extend({

    if: function() {
        return this.toConfRoot &&
               this.ns['http://jabber.org/protocol/disco#items'];
    },

    then: function(cb) {
        this.core.rooms.list(null, function(err, rooms) {
            if (err) {
                return cb(err);
            }

            var stanza = this.Iq();

            var query = stanza.c('query', {
                xmlns:'http://jabber.org/protocol/disco#items'
            });

            rooms.forEach(function(room) {
                query.c('item', {
                    jid: helper.getRoomJid(room.slug),
                    name: room.name
                });
            });

            cb(null, stanza);

        }.bind(this));
    }

});
