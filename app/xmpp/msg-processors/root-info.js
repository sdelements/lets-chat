'use strict';

var MessageProcessor = require('./../msg-processor'),
    settings = require('./../../config');

module.exports = MessageProcessor.extend({

    if: function() {
        return this.ns['http://jabber.org/protocol/disco#info'] && (
            this.to === this.connection.getDomain() ||
            this.to === settings.xmpp.domain
        );
    },

    then: function(cb) {
        var stanza = this.Iq();

        var query = stanza.c('query', {
            xmlns: 'http://jabber.org/protocol/disco#info'
        });

        query.c('identity', {
            category: 'server',
            type: 'im',
            name: 'Let\'s chat'
        });

        query.c('feature', {
            var: 'vcard-temp'
        });

        cb(null, stanza);
    }

});
