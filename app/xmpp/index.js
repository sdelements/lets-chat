'use strict';

var xmpp = require('node-xmpp-server'),
    Stanza = require('node-xmpp-core').Stanza,
    mongoose = require('mongoose'),
    settings = require('./../config'),
    auth = require('./../auth/index'),
    all = require('require-tree'),
    helper = require('./helper'),
    allArray = function(path) {
        var modules = all(path);
        return Object.keys(modules).map(function(key) {
            return modules[key];
        });
    };

var XmppConnection = require('./xmpp-connection'),
    msgProcessors = allArray('./msg-processors'),
    eventListeners = allArray('./events');

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
            auth.authenticate(opts.jid.local, opts.password,
                                              function(err, user) {
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
            var handled = msgProcessors.some(function(Processor) {
                var processor = new Processor(client, stanza, core);
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

    eventListeners.forEach(function(EventListener) {
        var listener = new EventListener(core);
        core.on(listener.on, listener.then);
    });
}

module.exports = xmppStart;
