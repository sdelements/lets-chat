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
            roomId = roomUrl.split('@')[0];

        this.core.rooms.get(roomId, function(err, room) {
            if (err) {
                return;
            }

            this.core.presence.join(this.client.conn, roomId);

            var screenNames = this.core.presence.rooms
                                  .get(roomId).getScreenNames();

            var presences = screenNames.map(function(screenName) {

                var presence = this.Presence({
                    from: helper.getRoomJid(roomId, screenName)
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
