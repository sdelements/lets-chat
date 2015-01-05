//
// Messages Controller
//

'use strict';

module.exports = function() {

    var app = this.app,
        core = this.core,
        middlewares = this.middlewares;

    core.on('messages:new', function(message) {
        app.io.room(message.room.id)
              .broadcast('messages:new', message);
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
                    req.io.respond(err, 400);
                    return;
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
                    req.io.respond(err, 400);
                    return;
                }
                req.io.respond(messages);
            });
        }
    });

};
