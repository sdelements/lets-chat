'use strict';

var MessageProcessor = require('./../msg-processor'),
    settings = require('./../../config');

module.exports = MessageProcessor.extend({

    if: function() {
        return this.request.name === 'message' &&
               this.toARoom;
    },

    then: function(cb) {
        var roomId = this.request.attrs.to.split('@')[0];

        var options = {
            owner: this.client.user._id,
            room: roomId,
            text: this.request.children[0].text()
        };

        this.core.messages.create(options, function(err, message) {
            if (err) {
                return;
            }

            // Message will be sent by listener
            cb(null);

        }.bind(this));
    }

});
