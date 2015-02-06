//
// Files Controller
//

'use strict';

var multer = require('multer'),
    settings = require('./../config').files,
    coreFiles = require('./../core/files');

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

        app.io.to(room._id)
              .emit('files:new', fil);
    });

    var fileUpload = multer({
        limits: {
            files: 1,
            fileSize: 100000000
        }
    });

    //
    // Routes
    //
    app.route('/files')
        .all(middlewares.requireLogin)
        .get(function(req, res) {
            req.io.route('files:list');
        })
        .post(fileUpload, function(req, res) {
            req.io.route('files:create');
        });

    app.route('/rooms/:room/files')
        .all(middlewares.requireLogin, middlewares.roomRoute)
        .get(function(req, res) {
            req.io.route('files:list');
        })
        .post(fileUpload, function(req, res) {
            req.io.route('files:create');
        });

    app.route('/files/:id/:name')
        .all(middlewares.requireLogin)
        .get(function(req, res) {
            models.file.findById(req.params.id, function(err, file) {
                if (err) {
                    // Error
                    return res.send(400);
                }

                var url = coreFiles.getUrl(file);
                if (settings.provider === 'local') {
                    res.contentType(file.type);
                    res.sendFile(url);
                } else {
                    res.redirect(url);
                }

            });
        });

    //
    // Sockets
    //
    app.io.route('files', {
        create: function(req, res) {
            if (!req.files || !req.files.file) {
                return res.sendStatus(400);
            }

            var options = {
                    owner: req.user._id,
                    room: req.param('room'),
                    file: req.files.file,
                    post: req.param('post') && true
                };

            core.files.create(options, function(err, file) {
                if (err) {
                    console.log(err);
                    return res.sendStatus(400);
                }
                res.status(201).json(file);
            });
        },
        list: function(req, res) {
            var options = {
                    room: req.param('room'),
                    reverse: req.param('reverse'),
                    skip: req.param('skip'),
                    take: req.param('take'),
                    expand: req.param('expand') || req.param('include')
                };

            core.files.list(options, function(err, files) {
                if (err) {
                    return res.sendStatus(400);
                }
                res.json(files);
            });
        }
    });

};
