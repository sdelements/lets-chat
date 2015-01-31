'use strict';

var mongoose = require('mongoose'),
    MessageProcessor = require('./../msg-processor'),
    settings = require('./../../config'),
    helper = require('./../helper');

module.exports = MessageProcessor.extend({

    if: function() {
        return this.request.type === 'get' && this.ns['jabber:iq:last'];
    },

    then: function(cb) {
        var stanza = this.Iq({
            to: helper.getUserJid(this.client.conn.username)
        });

        stanza.c('error', {
            type: 'auth'
        }).c('forbidden', {
            xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas'
        });

        cb(null, stanza);
    }

});
