//
// Connections Controller
//

'use strict';

module.exports = function() {

    var _ = require('lodash');

    var app = this.app,
        core = this.core,
        middlewares = this.middlewares,
        models = this.models,
        User = models.user;

    //
    // Routes
    //
    app.get('/connections', middlewares.requireLogin, function(req, res) {
        req.io.route('connections:list');
    });

    app.get('/connections/type/:type', middlewares.requireLogin, function(req, res) {
        req.io.route('connections:list');
    });

    app.get('/connections/user/:user', middlewares.requireLogin, function(req, res) {
        req.io.route('connections:list');
    });

    //
    // Sockets
    //
    app.io.route('connections', {
        list: function(req, res) {
            var query = {};

            if (req.param('type')) {
                query.type = req.param('type');
            }

            if (req.param('user')) {
                query.user = req.param('user');
            }

            var connections = core.presence.connections.query(query);
            res.json(connections);
        }
    });
};
