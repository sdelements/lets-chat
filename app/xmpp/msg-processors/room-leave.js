'use strict';

var MessageProcessor = require('./../msg-processor'),
    settings = require('./../../config');

module.exports = MessageProcessor.extend({

    if: function() {
        return this.request.name === 'presence' &&
               this.request.type === 'unavailable' &&
               this.toARoom;
    },

    then: function(cb) {
        var roomUrl = this.request.attrs.to.split('/')[0],
            roomId = roomUrl.split('@')[0];

        this.core.rooms.get(roomId, function(err, room) {
            if (err) {
                return;
            }

            this.core.presence.leave(this.client.conn, roomId);

            var presence = new this.Presence({
                to: this.request.attrs.from,
                from: this.request.attrs.to,
                type: 'unavailable'
            });

            var x = presence.c('x', {
                xmlns: 'http://jabber.org/protocol/muc#user'
            });
            x.c('item', {
                jid: this.request.attrs.from,
                role: 'none',
                affiliation: 'none'
            });
            x.c('status', {
                code: '110'
            });

            cb(null, presence);

        }.bind(this));
    }

});
