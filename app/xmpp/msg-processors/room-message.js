'use strict';

var _ = require('underscore'),
    MessageProcessor = require('./../msg-processor'),
    settings = require('./../../config');

module.exports = MessageProcessor.extend({

    if: function() {
        return this.request.name === 'message' &&
               this.toARoom;
    },

    then: function(cb) {
        var roomId = this.request.attrs.to.split('@')[0];

        var body = _.find(this.request.children, function (child) {
            return child.name === 'body';
        });

        if (!body) {
            return;
        }

        var options = {
            owner: this.client.user._id,
            room: roomId,
            text: body.text()
        };

        this.core.messages.create(options, function(err, message) {
            // Message will be sent by listener
            cb(err);
        }.bind(this));
    }

});
