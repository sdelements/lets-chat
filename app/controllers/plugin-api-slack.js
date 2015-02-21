//
// Slack API Controller
//

'use strict';

module.exports = function() {

    var app = this.app,
        core = this.core,
        middlewares = this.middlewares;

    //
    // Routes
    //
    app.route('/services/hooks/incoming-webhook')
        .all(middlewares.requireLogin)
        .post(function(req, res) {

            // Support the payload form variable
            var payload = req.body.payload;
            if (payload) {
                payload = JSON.parse(payload);
                req.params['channel'] = payload.channel;
                req.params['text'] = payload.text;
            }

            var options = {
                    owner: req.user._id,
                    room: req.param('channel'),
                    text: req.param('text')
                };

            core.messages.create(options, function(err, message) {
                if (err) {
                    res.status(400).json({
                        ok: false,
                        error: err
                    });
                }
                else {
                    res.status(201).json({
                        ok: true,
                        channel: options.room
                    });
                }
            });

        });
};
