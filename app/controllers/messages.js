//
// Messages Controller
//

'use strict';

module.exports = function() {

    var app = this.app,
        core = this.core,
        middlewares = this.middlewares,
        models = this.models,
        Room = models.room;

    core.on('messages:new', function(message, room, user) {
        var msg = message.toJSON();
        msg.owner = user;
        msg.room = room;

        app.io.to(room._id)
              .emit('messages:new', msg);
    });

    //
    // Routes
    //
    app.route('/messages')
        .all(middlewares.requireLogin)
        .get(function(req, res) {
            req.io.route('messages:list');
        })
        .post(function(req, res) {
            req.io.route('messages:create');
        });

    app.route('/rooms/:room/messages')
        .all(middlewares.requireLogin, middlewares.roomRoute)
        .get(function(req, res) {
            req.io.route('messages:list');
        })
        .post(function(req, res) {
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
                    room: req.param('room'),
                    since_id: req.param('since_id'),
                    from: req.param('from'),
                    to: req.param('to'),
                    skip: req.param('skip'),
                    take: req.param('take') || req.param('limit'),
                    include: req.param('include')
                };

            if (req.isSocket) {
                options.since_id = req.param('since_id') || req.param('from');
                options.include = 'owner,room';
            }

            core.messages.list(options, function(err, messages) {
                if (err) {
                    return res.sendStatus(400);
                }
                res.json(messages.reverse());
            });
        }
    });

};
