//
// Misc  Controller
//

'use strict';

var path = require('path'),
    settings = require('./../config');

module.exports = function() {

    var app = this.app;

    //
    // Routes
    //
    app.get('/robots.txt', function(req, res) {
        if (!settings.noRobots) {
            return res.sendStatus(404);
        }

        res.sendFile(path.resolve(__dirname, '../misc/robots.txt'));
    });

};
