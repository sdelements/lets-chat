'use strict';

var MessageProcessor = require('./../msg-processor'),
    settings = require('./../../config');

module.exports = MessageProcessor.extend({

    if: function() {
        return this.toARoom &&
               !this.request.type &&
               this.request.name === 'presence';
    },

    then: function(cb) {
        var roomUrl = this.request.attrs.to.split('/')[0],
            roomId = roomUrl.split('@')[0];

        this.core.rooms.get(roomId, function(err, room) {
            if (err) {
                return;
            }

            this.core.presence.join(this.client.conn, roomId);

            var userIds = this.core.presence.rooms.get(roomId).getUserIds();

            var presences = userIds.map(function(userId) {

                var presence = new this.Presence({
                    id: this.request.attrs.id,
                    to: this.request.attrs.from,
                    from: roomUrl + '/' + userId
                });

                presence
                    .c('x', {
                        xmlns:'http://jabber.org/protocol/muc#user'
                    })
                    .c('item', {
                        affiliation: 'none',
                        role: 'participant'
                    });

                return presence;

            }, this);

            var message = new this.Message({
                id: this.request.attrs.id,
                to: this.request.attrs.from,
                from: this.request.attrs.to,
                type: 'groupchat'
            });

            message.c('subject').t(room.name);

            cb(null, presences, message);

        }.bind(this));
    }

});
