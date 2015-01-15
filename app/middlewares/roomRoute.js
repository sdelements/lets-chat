//
// Require Login
//

'use strict';

var mongoose = require('mongoose');

module.exports = function(req, res, next) {
    var room = req.params.room;

    if (!room) {
        return req.io.respond(404);
    }

    var Room = mongoose.model('Room');

    Room.findByIdOrSlug(room, function(err, room) {
        if (err) {
            return req.io.respond(err, 400);
        }

        if (!room) {
            return req.io.respond(404);
        }

        var roomId = room._id.toString();

        req.params.room = roomId;
        req.body.room = roomId;
        req.query.room = roomId;

        next();
    });
};
