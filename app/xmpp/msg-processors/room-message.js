'use strict';

var _ = require('underscore'),
    MessageProcessor = require('./../msg-processor'),
    settings = require('./../../config');

module.exports = MessageProcessor.extend({

    if: function() {
        return this.request.name === 'message' &&
               this.request.type === 'groupchat' &&
               this.toARoom;
    },

    then: function(cb) {
        var roomSlug = this.request.attrs.to.split('@')[0];

        var body = _.find(this.request.children, function (child) {
            return child.name === 'body';
        });

        if (!body) {
            return;
        }

        this.core.rooms.slug(roomSlug, function(err, room) {
            
            var options = {
                owner: this.client.user._id,
                room: room._id,
                text: body.text()
            };

            this.core.messages.create(options, function(err, message) {
                // Message will be sent by listener
                cb(err);
            }.bind(this));

        }.bind(this));
    }

});
