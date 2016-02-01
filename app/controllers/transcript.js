//
// Transcript Controller
//

'use strict';

module.exports = function() {
    var app = this.app,
        core = this.core,
        middlewares = this.middlewares;

    //
    // Routes
    //
    app.get('/transcript', middlewares.requireLogin, function(req, res) {
        var roomId = req.param('room');
        core.rooms.get(roomId, function(err, room) {
            if (err) {
                console.error(err);
                return res.sendStatus(404);
            }

            if (!room) {
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
};
