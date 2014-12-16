'use strict';

var xmpp = require('node-xmpp-server'),
    Stanza = require('node-xmpp-core').Stanza,
    mongoose = require('mongoose'),
    settings = require('./../config'),
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
    var c2s = new xmpp.C2SServer({
        port: settings.xmpp.port,
        domain: settings.xmpp.host
    });

    c2s.on('connect', function(client) {

        client.on('authenticate', function(opts, cb) {
            var User = mongoose.model('User');
            User.authenticate(opts.jid.local,
                              opts.password, function(err, user) {

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

    core.messages.on('messages:new', function(msg) {
        var connections =
            core.presence.rooms.get(msg.room.id).connections.byType('xmpp');

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
