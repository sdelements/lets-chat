//
// Audio  Controller
//

'use strict';

var settings = require('./../config');

module.exports = function() {

    var app = this.app,
        core = this.core,
        middlewares = this.middlewares;

    app.get('/audio/notification', middlewares.requireLogin, function(req) {
        req.io.route('audio:notification:settings');
    });

    app.post('/audio/notification/toggle', middlewares.requireLogin, function(req) {
        req.io.route('audio:notification:toggle');
    });

    //
    // Sockets
    //
    app.io.route('audio', {
        'notification:settings': function(req, res) {
            var enabled = settings.audio.notifications.enabled && req.user.audioNotifications;
            res.json({
                enabled: enabled,
                file: settings.audio.notifications.file
            });
        },
        'notification:toggle': function(req, res) {
            core.account.update(req.user._id, { audioNotifications: !req.user.audioNotifications }, function (err) {
                if (err) {
                    res.json({
                        status: 'error',
                        message: err
                    });
                }
                res.json({
                    status: 'success'
                });
            });
        }
    });
};
