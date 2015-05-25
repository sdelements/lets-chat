//
// Messages Controller
//

'use strict';

module.exports = function() {

    var app = this.app,
        core = this.core,
        middlewares = this.middlewares;

    core.on('messages:new', function(message, room, user) {
        var msg = message.toJSON();
        msg.owner = user;
        msg.room = room.toJSON(user);

        app.io.to(room.id)
              .emit('messages:new', msg);
    });

    //
    // Routes
    //
    app.route('/messages')
        .all(middlewares.requireLogin)
        .get(function(req) {
            req.io.route('messages:list');
        })
        .post(function(req) {
            req.io.route('messages:create');
        });

    app.route('/rooms/:room/messages')
        .all(middlewares.requireLogin, middlewares.roomRoute)
        .get(function(req) {
            req.io.route('messages:list');
        })
        .post(function(req) {
            req.io.route('messages:create');
        });

    //
    // Sockets
    //
    app.io.route('messages', {
        create: function(req, res) {
            var options = {
                    owner: req.user._id,
                    room: req.param('room'),
                    text: req.param('text')
                };

            core.messages.create(options, function(err, message) {
                if (err) {
                    return res.sendStatus(400);
                }
                res.status(201).json(message);
            });
        },
        list: function(req, res) {
            var options = {
                    userId: req.user._id,
                    password: req.param('password'),

                    room: req.param('room'),
                    since_id: req.param('since_id'),
                    from: req.param('from'),
                    to: req.param('to'),
                    query: req.param('query'),
                    reverse: req.param('reverse'),
                    skip: req.param('skip'),
                    take: req.param('take'),
                    expand: req.param('expand')
                };

            core.messages.list(options, function(err, messages) {
                if (err) {
                    return res.sendStatus(400);
                }

                messages = messages.map(function(message) {
                    return message.toJSON(req.user);
                });

                res.json(messages);
            });
        }
    });

};
