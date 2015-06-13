'use strict';

var MessageProcessor = require('./../msg-processor');

module.exports = MessageProcessor.extend({

    if: function() {
        return this.request.name === 'presence' &&
               this.request.type === 'unavailable' &&
               this.toARoom;
    },

    then: function(cb) {
        var roomUrl = this.request.attrs.to.split('/')[0],
            roomSlug = roomUrl.split('@')[0];

        this.core.rooms.slug(roomSlug, function(err, room) {
            if (err) {
                return cb(err);
            }

            if (!room) {
                return cb();
            }

            this.core.presence.leave(this.client.conn, room._id);

            var presence = this.Presence({
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
