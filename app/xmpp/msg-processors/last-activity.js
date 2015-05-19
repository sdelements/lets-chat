'use strict';

var mongoose = require('mongoose'),
    MessageProcessor = require('./../msg-processor'),
    settings = require('./../../config');

module.exports = MessageProcessor.extend({

    if: function() {
        return this.request.type === 'get' && this.ns['jabber:iq:last'];
    },

    then: function(cb) {
        var stanza = this.Iq({
            to: this.connection.jid()
        });

        stanza.c('error', {
            type: 'auth'
        }).c('forbidden', {
            xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas'
        });

        cb(null, stanza);
    }

});
