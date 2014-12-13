'use strict';

var MessageProcessor = require('./../msg-processor'),
    settings = require('./../../config');

module.exports = MessageProcessor.extend({

    if: function() {
        return this.request.type === 'get' && this.ns['jabber:iq:roster'];
    },

    // Roster is always empty - everyone is friendless
    // This should only be implemented if we support 1-to-1 private convos
    then: function(cb) {
        var stanza = this.Iq();

        var v = stanza.c('query', {
            xmlns: 'jabber:iq:roster'
        });

        cb(null, stanza);
    }

});
