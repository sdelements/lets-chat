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
        if (settings.misc && settings.misc.noRobots) {
            res.sendFile(path.resolve(__dirname, '../misc/robots.txt'));
        } else {
            res.send(404);
        }
    });

};
