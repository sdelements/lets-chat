//
// Transcript Controller
//

'use strict';

var _ = require('lodash');

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
    app.get('/transcript', middlewares.requireLogin, function(req, res) {
        var roomId = req.param('room');
        core.rooms.get(roomId, function(err, room) {
            if (err || !room) {
                err && console.error(err)
                return res.sendStatus(404);
            }
            res.render('transcript.html', {
                room: {
                    id: roomId,
                    name: room.name
                }
            });
        });
    });
}
