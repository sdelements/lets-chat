//
// UserMessages Controller
//

'use strict';

var _ = require('lodash'),
    settings = require('./../config');

module.exports = function() {

    var app = this.app,
        core = this.core,
        middlewares = this.middlewares;


    if (!settings.private.enable) {
        return;
    }

    core.on('user-messages:new', function(message) {
        _.each(message.users, function(userId) {
            var connections = core.presence.system.connections.query({
                type: 'socket.io', userId: userId.toString()
            });

            _.each(connections, function(connection) {
                connection.socket.emit('user-messages:new', message);
            });
        });
    });

    //
    // Routes
    //

    app.route('/users/:user/messages')
        .all(middlewares.requireLogin)
        .get(function(req) {
            req.io.route('user-messages:list');
        })
        .post(function(req) {
            req.io.route('user-messages:create');
        });

    //
    // Sockets
    //
    app.io.route('user-messages', {
        create: function(req, res) {
            var options = {
                    owner: req.user._id,
                    user: req.param('user'),
                    text: req.param('text')
                };

            core.usermessages.create(options, function(err, message) {
                if (err) {
                    return res.sendStatus(400);
                }
                res.status(201).json(message);
            });
        },
        list: function(req, res) {
            var options = {
                    currentUser: req.user._id,
                    user: req.param('user'),
                    since_id: req.param('since_id'),
                    from: req.param('from'),
                    to: req.param('to'),
                    reverse: req.param('reverse'),
                    skip: req.param('skip'),
                    take: req.param('take'),
                    expand: req.param('expand')
                };

            core.usermessages.list(options, function(err, messages) {
                if (err) {
                    return res.sendStatus(400);
                }
                res.json(messages);
            });
        }
    });

};
