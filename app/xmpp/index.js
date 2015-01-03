'use strict';

var xmpp = require('node-xmpp-server'),
    Stanza = require('node-xmpp-core').Stanza,
    mongoose = require('mongoose'),
    settings = require('./../config'),
    auth = require('./../auth/index'),
    all = require('require-tree'),
    helper = require('./helper');

var XmppConnection = require('./xmpp-connection');

var msgProcessors = (function(){
        var modules = all('./msg-processors');
        return Object.keys(modules).map(function(key) {
            return { key: key, Processor: modules[key]};
        });
    })();

function xmppStart(core) {
    var options = {
        port: settings.xmpp.port,
        domain: settings.xmpp.host
    };

    if (settings.xmpp.tls) {
        options.tls = {
            keyPath: settings.xmpp.tls.keyPath,
            certPath: settings.xmpp.tls.certPath
        };
    }

    var c2s = new xmpp.C2SServer(options);

    c2s.on('connect', function(client) {

        client.on('authenticate', function(opts, cb) {
            var req = {
                body: {
                    username: opts.jid.local,
                    password: opts.password
                }
            };

            auth.authenticate(req, function(err, user) {
                if (err || !user) {
                    return cb(false);
                }

                client.user = user;

                var conn = new XmppConnection(
                    user._id, user.screenName, client
                );
                core.presence.connect(conn);

                cb(null, opts);
            });
        });

        client.on('online', function() {
        });

        client.on('stanza', function(stanza) {
            var handled = msgProcessors.some(function(pro) {
                var processor = new pro.Processor(client, stanza, core);
                return processor.run();
            });

            if (!handled && settings.xmpp.debug.unhandled) {
                // Print unhandled request
                console.log(' ');
                console.log(stanza.root().toString().red);
            }
        });

        // On Disconnect event. When a client disconnects
        client.on('disconnect', function() {
        });
    });

    core.rooms.on('rooms:archived', function(room) {
        var roomm = core.presence.rooms.get(room._id);

        if (!roomm) {
            return;
        }

        var connections = roomm.connections.byType('xmpp');

        connections.forEach(function(conn) {

            // Kick connection from room!

            var presence = new Stanza.Presence({
                to: helper.getRoomJid(roomm.roomSlug, conn.screenName),
                from: helper.getRoomJid(roomm.roomSlug, conn.screenName),
                type: 'unavailable'
            });

            var x = presence
                    .c('x', {
                        xmlns:'http://jabber.org/protocol/muc#user'
                    });

            x.c('item', {
                jid: helper.getRoomJid(roomm.roomSlug, conn.screenName),
                affiliation: 'none',
                role: 'none'
            });

            x.c('destroy').c('reason').t('Room closed');

            if (settings.xmpp.debug.handled) {
                console.log(' ');
                console.log(presence.root().toString().yellow);
            }

            conn.client.send(presence);
        });

        roomm.connections.removeAll();
    });

    core.messages.on('messages:new', function(msg) {
        var room = core.presence.rooms.get(msg.room.id);

        if (!room) {
            return;
        }

        var connections = room.connections.byType('xmpp');

        connections.forEach(function(conn) {
            var stanza = new Stanza.Message({
                id: msg._id,
                type: 'groupchat',
                to: helper.getRoomJid(msg.room.slug),
                from: helper.getRoomJid(msg.room.slug, msg.owner.screenName)
            });

            stanza.c('active', {
                xmlns: 'http://jabber.org/protocol/chatstates'
            });

            stanza.c('body').t(msg.text);

            if (settings.xmpp.debug.handled) {
                console.log(' ');
                console.log(stanza.root().toString().yellow);
            }

            conn.client.send(stanza);
        });
    });

    core.presence.rooms.on('user_join', function(data) {
        var connections =
            core.presence.rooms.get(data.roomId).connections.byType('xmpp');

        connections.forEach(function(conn) {
            var presence = new Stanza.Presence({
                to: helper.getRoomJid(data.roomSlug, conn.screenName),
                from: helper.getRoomJid(data.roomSlug, data.screenName)
            });

            presence
            .c('x', {
                xmlns:'http://jabber.org/protocol/muc#user'
            })
            .c('item', {
                jid: helper.getRoomJid(data.roomSlug, data.screenName),
                affiliation: 'none',
                role: 'participant'
            });

            if (settings.xmpp.debug.handled) {
                console.log(' ');
                console.log(presence.root().toString().yellow);
            }

            conn.client.send(presence);
        });
    });

    core.presence.rooms.on('user_leave', function(data) {
        var connections =
            core.presence.rooms.get(data.roomId).connections.byType('xmpp');

        connections.forEach(function(conn) {
            var presence = new Stanza.Presence({
                to: helper.getRoomJid(data.roomSlug, conn.screenName),
                from: helper.getRoomJid(data.roomSlug, data.screenName),
                type: 'unavailable'
            });

            var x = presence.c('x', {
                xmlns: 'http://jabber.org/protocol/muc#user'
            });
            x.c('item', {
                jid: helper.getRoomJid(data.roomSlug, data.screenName),
                role: 'none',
                affiliation: 'none'
            });
            x.c('status', {
                code: '110'
            });

            if (settings.xmpp.debug.handled) {
                console.log(' ');
                console.log(presence.root().toString().yellow);
            }

            conn.client.send(presence);

        });
    });
}

module.exports = xmppStart;
