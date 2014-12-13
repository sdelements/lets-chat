'use strict';

var MessageProcessor = require('./../msg-processor'),
    settings = require('./../../config');

module.exports = MessageProcessor.extend({

    if: function() {
        return this.to === settings.xmpp.host &&
               this.ns['http://jabber.org/protocol/disco#items'];
    },

    then: function(cb) {
        var stanza = this.Iq();

        var query = stanza.c('query', {
            xmlns:'http://jabber.org/protocol/disco#items'
        });

        query.c('item', {
            jid: settings.xmpp.confhost,
            name: 'Let\'s Chat Conference Service'
        });

        cb(null, stanza);
    }

});
