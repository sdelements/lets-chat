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

        app.io.room(room._id)
              .broadcast('messages:new', msg);
    });

    //
    // Routes
    //
    app.get('/messages', middlewares.requireLogin, function(req, res) {
        req.io.route('messages:list');
    });

    app.post('/messages', middlewares.requireLogin, function(req, res) {
        req.io.route('messages:create');
    });

    app.get('/rooms/:room/messages', middlewares.requireLogin, middlewares.roomRoute, function(req, res) {
        req.io.route('messages:list');
    });

    app.post('/rooms/:room/messages', middlewares.requireLogin, middlewares.roomRoute, function(req, res) {
        req.io.route('messages:create');
    });

    //
    // Sockets
    //
    app.io.route('messages', {
        create: function(req) {
            var data = req.data || req.body,
                options = {
                    owner: req.user._id,
                    room: data.room,
                    text: data.text
                };

            core.messages.create(options, function(err, message) {
                if (err) {
                    return req.io.respond(400);
                }
                req.io.respond(message, 201);
            });
        },
        list: function(req) {
            var data = req.data || req.query,
                options = {
                    room: data.room || null,
                    from: data.from || null,
                    limit: data.limit || null,
                };

            core.messages.list(options, function(err, messages) {
                if (err) {
                    return req.io.respond(400);
                }
                req.io.respond(messages, 200);
            });
        }
    });

};
