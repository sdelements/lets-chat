'use strict';

var MessageProcessor = require('./../msg-processor'),
    settings = require('./../../config'),
    helper = require('./../helper');

module.exports = MessageProcessor.extend({

    if: function() {
        return this.toARoom &&
               !this.request.type &&
               this.request.name === 'presence';
    },

    then: function(cb) {
        var roomUrl = this.request.attrs.to.split('/')[0],
            roomSlug = roomUrl.split('@')[0];

        this.core.rooms.get(roomSlug, function(err, room) {
            if (err) {
                return cb(err);
            }
            if (!room) {
                return cb(null);
            }

            this.core.presence.join(this.client.conn, room._id, room.slug);

            var usernames = this.core.presence.rooms
                                  .get(room._id).getUsernames();

            var presences = usernames.map(function(username) {

                var presence = this.Presence({
                    from: helper.getRoomJid(room.slug, username)
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

            var message = this.Message({
                type: 'groupchat'
            });

            message.c('subject').t(room.name);

            cb(null, presences, message);

        }.bind(this));
    }

});
