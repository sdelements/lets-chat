'use strict';

var MessageProcessor = require('./../msg-processor');

module.exports = MessageProcessor.extend({

    if: function() {
        return this.ns['urn:xmpp:ping'];
    },

    then: function(cb) {
        cb(null, this.Iq());
    }

});
