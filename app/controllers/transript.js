//
// Rooms Controller
//

'use strict';

var _ = require('underscore');

module.exports = function() {
    var app = this.app,
        core = this.core,
        middlewares = this.middlewares,
        models = this.models,
        Room = models.room,
        User = models.user;

    //
    // Routes
    //
    app.get('/transcript/:room', middlewares.requireLogin, function(req, res) {
        core.rooms.get(req.params.room, function(err, room) {
            if (err) {
                console.error(err);
                return req.io.respond(err, 400);
            }
            res.render('transcript.html', {
                room: {id: room.id, name: room.name}
            });
        });
    });

    //
    // Sockets
    //
    app.io.route('transcript', {
        get: function(req) {
            var data = req.data || req.query,
                options = {
                    room: data.room || null,
                    fromDate: data.fromDate || null,
                    toDate: data.toDate || null
                };

            core.messages.transcript(options, function(err, messages) {
                if (err) {
                    return req.io.respond(err, 400);
                }
                req.io.respond(messages);
            });
        }
    });
}
