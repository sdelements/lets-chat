//
// Files Controller
//

'use strict';

var settings = require('./../config').files;

module.exports = function() {

    if (!settings.enable) {
        return;
    }

    var app = this.app,
        core = this.core,
        middlewares = this.middlewares,
        models = this.models,
        Room = models.room;

    core.on('files:new', function(file, room, user) {
        var fil = file.toJSON();
        fil.owner = user;
        fil.room = room;

        app.io.room(room._id)
              .broadcast('files:new', fil);
    });

    //
    // Routes
    //
    app.get('/files', middlewares.requireLogin, function(req, res) {
        req.io.route('files:list');
    });

    app.post('/files', middlewares.requireLogin, function(req, res) {
        req.io.route('files:create');
    });

    app.get('/rooms/:room/files', middlewares.requireLogin, middlewares.roomRoute, function(req, res) {
        req.io.route('files:list');
    });

    app.post('/rooms/:room/files', middlewares.requireLogin, middlewares.roomRoute, function(req, res) {
        req.io.route('files:create');
    });

    if (settings.provider === 'local') {
        app.get('/files/:id/:name',
                middlewares.requireLogin, function(req, res) {

            models.file.findById(req.params.id, function(err, file) {
                if (err) {
                    // Error
                    return res.send(400);
                }

                res.contentType(file.type);
                res.sendfile(settings.local.uploads_dir + '/' + file._id);
            });
        });
    }

    //
    // Sockets
    //
    app.io.route('files', {
        create: function(req) {
            if (!req.files || !req.files.file) {
                return req.io.respond(400);
            }

            var data = req.data || req.body,
                options = {
                    owner: req.user._id,
                    room: data.room,
                    file: req.files.file
                };

            core.files.create(options, function(err, file) {
                if (err) {
                    console.log(err)
                    return req.io.respond(400);
                }
                req.io.respond(file, 201);
            });
        },
        list: function(req) {
            var data = req.data || req.query,
                options = {
                    room: data.room || null
                };

            core.files.list(options, function(err, files) {
                if (err) {
                    return req.io.respond(400);
                }
                req.io.respond(files, 200);
            });
        }
    });

};
