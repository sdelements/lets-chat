'use strict';

var _ = require('lodash'),
    moment = require('moment'),
    Stanza = require('node-xmpp-core').Stanza,
    MessageProcessor = require('./../msg-processor'),
    settings = require('./../../config');

module.exports = MessageProcessor.extend({

    if: function() {
        var roomPresense = this.toARoom &&
               !this.request.type &&
               this.request.name === 'presence';

        if (!roomPresense) {
            return false;
        }

        var toParts = this.request.attrs.to.split('/'),
            roomUrl = toParts[0],
            roomSlug = roomUrl.split('@')[0];

        var proom = this.core.presence.rooms.slug(roomSlug);

        if (proom && proom.connections.contains(this.connection)) {
            // If this connection is already in the room
            // then no need to run this message processor
            return false;
        }

        return true;
    },

    then: function(cb) {
        var toParts = this.request.attrs.to.split('/'),
            roomUrl = toParts[0],
            nickname = toParts[1],
            roomSlug = roomUrl.split('@')[0],
            connection = this.client.conn;

        this.connection.nickname(roomSlug, nickname);

        this.core.rooms.slug(roomSlug, function(err, room) {
            if (err) {
                return cb(err);
            }

            if (room) {
                return this.handleJoin(room, cb);
            }

            if (!settings.xmpp.roomCreation) {
                return this.cantCreateRoom(roomSlug, cb);
            }

            this.createRoom(roomSlug, function(err, room) {
                if (err) {
                    return cb(err);
                }
                this.handleJoin(room, cb);
            }.bind(this));
        }.bind(this));
    },

    createRoom: function(roomSlug, cb) {
        var options = {
            owner: this.connection.user.id,
            name: roomSlug,
            slug: roomSlug,
            description: ''
        };
        this.core.rooms.create(options, cb);
    },

    cantCreateRoom: function(roomSlug, cb) {
        var presence = this.Presence({
            from: this.connection.getRoomJid(roomSlug, 'admin'),
            type: 'error'
        });

        presence.c('x', {
            xmlns:'http://jabber.org/protocol/muc'
        });

        presence.c('error', {
            by: this.connection.getRoomJid(roomSlug),
            type: 'cancel'
        }).c('not-allowed', {
            xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas'
        });

        cb(null, presence);
    },

    handleJoin: function(room, cb) {
        var username = this.connection.user.username;

        var proom = this.core.presence.rooms.get(room._id);
        var usernames = proom ? proom.getUsernames() : [];

        // User's own presence must be last - and be their nickname
        var i = usernames.indexOf(username);
        if (i > -1) {
            usernames.splice(i, 1);
        }
        usernames.push(this.connection.user.username);

        var presences = usernames.map(function(username) {

            var presence = this.Presence({
                from: this.connection.getRoomJid(room.slug, username)
            });

            presence
                .c('x', {
                    xmlns:'http://jabber.org/protocol/muc#user'
                })
                .c('item', {
                    jid: this.connection.getUserJid(username),
                    affiliation: 'none',
                    role: 'participant'
                });

            return presence;

        }, this);

        var subject = this.Message({
            type: 'groupchat'
        });

        subject.c('subject').t(room.name + ' | ' + room.description);

        var xNode = _.find(this.request.children, function(child) {
            return child.name === 'x';
        });

        var historyNode;
        if (xNode) {
            historyNode = _.find(xNode.children, function(child) {
                return child.name === 'history';
            });
        }

        if (!historyNode ||
            historyNode.attrs.maxchars === 0 ||
            historyNode.attrs.maxchars === '0') {
                // Send no history
                this.core.presence.join(this.connection, room._id, room.slug);
                return cb(null, presences, subject);
        }

        var query = {
            room: room._id,
            expand: 'owner'
        };

        if (historyNode.attrs.since) {
            query.from = moment(historyNode.attrs.since).utc().toDate();
        }

        if (historyNode.attrs.seconds) {
            query.from = moment()
                .subtract(historyNode.attrs.seconds, 'seconds')
                .utc()
                .toDate();
        }

        if (historyNode.attrs.maxstanzas) {
            query.take = historyNode.attrs.maxstanzas;
        }

        this.core.messages.list(query, function(err, messages) {

            messages.reverse();

            var msgs = messages.map(function(msg) {

                var stanza = new Stanza.Message({
                    id: msg._id,
                    type: 'groupchat',
                    to: this.connection.getRoomJid(room.slug),
                    from: this.connection.getRoomJid(room.slug, msg.owner.username)
                });

                stanza.c('body').t(msg.text);

                stanza.c('delay', {
                    xmlns: 'urn:xmpp:delay',
                    from: this.connection.getRoomJid(room.slug),
                    stamp: msg.posted.toISOString()
                });

                stanza.c('addresses', {
                    xmlns: 'http://jabber.org/protocol/address'
                }).c('address', {
                    type: 'ofrom',
                    jid: this.connection.getUserJid(msg.owner.username)
                });

                return stanza;

            }, this);

            this.core.presence.join(this.connection, room._id, room.slug);
            cb(null, presences, msgs, subject);

        }.bind(this));
    }

});
