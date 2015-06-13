'use strict';

var MessageProcessor = require('./../msg-processor');

module.exports = MessageProcessor.extend({

    if: function() {
        return this.request.type === 'set' && this.ns['vcard-temp'];
    },

    then: function(cb) {
        // Pretend we accepted the request
        cb(null, this.Iq());
    }

});
