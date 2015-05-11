//
// Audio  Controller
//

'use strict';

var path = require('path'),
    settings = require('./../config');

module.exports = function() {

    var app = this.app,
        middlewares = this.middlewares;

    app.get('/audio/notification', middlewares.requireLogin, function(req, res) {
        req.io.route('audio:notification');
    });

    //
    // Sockets
    //
    app.io.route('audio', {
        'notification': function(req, res) {
            res.json({ 
                enabled: settings.audio.notifications.enabled,
                file: settings.audio.notifications.file
            })
        }
    });
    

};
