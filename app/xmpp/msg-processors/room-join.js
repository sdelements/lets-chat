'use strict';

var _ = require('lodash'),
    Stanza = require('node-xmpp-core').Stanza,
    MessageProcessor = require('./../msg-processor'),
    settings = require('./../../config'),
    helper = require('./../helper');

module.exports = MessageProcessor.extend({

    if: function() {
        return this.toARoom &&
               !this.request.type &&
               this.request.name === 'presence';
    },

    then: function(cb) {
        var toParts = this.request.attrs.to.split('/'),
            roomUrl = toParts[0],
            nickname = toParts[1],
            roomSlug = roomUrl.split('@')[0],
            connection = this.client.conn;

        // TODO: Do we need to track nickname for each individual room?
        connection.nickname = nickname;

        var xNode = _.find(this.request.children, function(child) {
            return child.name === 'x';
        });

        var historyNode;
        if (xNode) {
            var historyNode = _.find(xNode.children, function(child) {
                return child.name === 'history';
            });
        }

        this.core.rooms.slug(roomSlug, function(err, room) {
            if (err) {
                return cb(err);
            }
            if (!room) {
                return cb(null);
            }

            var username = connection.username;

            this.core.presence.join(connection, room._id, room.slug);

            var usernames = this.core.presence.rooms
                                  .get(room._id).getUsernames();

            // User's own presence must be last - and be their nickname
            var i = usernames.indexOf(username);
            if (i > -1) {
                usernames.splice(i, 1);
            }
            usernames.push(nickname);

            var presences = usernames.map(function(username) {

                var presence = this.Presence({
                    from: helper.getRoomJid(room.slug, username)
                });

                presence
                    .c('x', {
                        xmlns:'http://jabber.org/protocol/muc#user'
                    })
                    .c('item', {
                        jid: helper.getUserJid(username),
                        affiliation: 'none',
                        role: 'participant'
                    });

                return presence;

            }, this);

            var subject = this.Message({
                type: 'groupchat'
            });

            subject.c('subject').t(room.name + ' | ' + room.description);

            if (!historyNode) {
                return cb(null, presences, subject);
            }

            var since = historyNode.attrs.since;
            this.core.messages.list({since:since}, function(err, messages) {

                var msgs = messages.map(function(msg) {

                    var stanza = new Stanza.Message({
                        id: msg._id,
                        type: 'groupchat',
                        to: helper.getRoomJid(room.slug),
                        from: helper.getRoomJid(room.slug, msg.owner.username)
                    });

                    stanza.c('body').t(msg.text);

                    stanza.c('delay', {
                        xmlns: 'urn:xmpp:delay',
                        from: helper.getRoomJid(room.slug),
                        stamp: msg.posted.toISOString()
                    });

                    return stanza;

                }, this);

                cb(null, presences, subject, msgs);

            }.bind(this));

        }.bind(this));
    }

});
