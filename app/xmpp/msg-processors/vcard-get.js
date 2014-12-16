'use strict';

var MessageProcessor = require('./../msg-processor'),
    settings = require('./../../config');

module.exports = MessageProcessor.extend({

    if: function() {
        return this.request.type === 'get' && this.ns['vcard-temp'];
    },

    then: function(cb) {
        var stanza = this.Iq();

        var v = stanza.c('vCard', {
            xmlns: 'vcard-temp'
        });

        v.c('FN').t(this.client.user.firstName + ' ' +
                    this.client.user.lastName);


        var name = v.c('N');
        name.c('GIVEN').t(this.client.user.firstName);
        name.c('FAMILY').t(this.client.user.lastName);

        v.c('NICKNAME').t(this.client.user.username);

        cb(null, stanza);
    }

});
