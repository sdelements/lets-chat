'use strict';

var MessageProcessor = require('./../msg-processor');

module.exports = MessageProcessor.extend({

    if: function() {
        return this.toARoom &&
               this.ns['http://jabber.org/protocol/disco#items'];
    },

    then: function(cb) {
        var stanza = this.Iq();

        stanza.c('query', {
            xmlns: 'http://jabber.org/protocol/disco#items'
        });

        cb(null, stanza);
    }

});
