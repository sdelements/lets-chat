'use strict';

var _ = require('lodash'),
    moment = require('moment'),
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

            if (!historyNode ||
                historyNode.attrs.maxchars === 0 ||
                historyNode.attrs.maxchars === '0') {
                    // Send no history
                    this.core.presence.join(connection, room._id, room.slug);
                    return cb(null, presences, subject);
            }

            var query = {};

            if (historyNode.attrs.since) {
                query.since = moment(historyNode.attrs.since).utc().toDate();
            }

            if (historyNode.attrs.seconds) {
                query.since = moment()
                    .subtract(historyNode.attrs.since, 'seconds')
                    .utc()
                    .toDate();
            }

            if (historyNode.attrs.maxstanzas) {
                query.limit = historyNode.attrs.maxstanzas;
            }

            this.core.messages.list(query, function(err, messages) {

                messages.reverse();

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

                    stanza.c('addresses', {
                        xmlns: 'http://jabber.org/protocol/address'
                    }).c('address', {
                        type: 'ofrom',
                        jid: helper.getUserJid(msg.owner.username)
                    });

                    return stanza;

                }, this);

                this.core.presence.join(connection, room._id, room.slug);
                cb(null, presences, msgs, subject);

            }.bind(this));

        }.bind(this));
    }

});
