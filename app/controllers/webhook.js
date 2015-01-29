//
// Messages Controller
//

'use strict';

module.exports = function() {

    var app = this.app,
        core = this.core,
        middlewares = this.middlewares;


    //
    // Routes
    //
    app.route('/webhook')
        .all(middlewares.requireLogin)
        .post(function(req, res) {
            if (req.query.room === undefined || req.query.text === undefined) {
                return res.sendStatus(400);
            }
            var options = {
                owner: req.user._id,
                room: req.query.room,
                text: req.query.text
            };

            core.messages.create(options, function(err, message) {
                if (err) {
                    return res.sendStatus(400);
                }
                res.status(201).json(message);
            });
        });
};
