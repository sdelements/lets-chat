//
// Files Controller
//

'use strict';

var fs = require('fs'),
    _ = require('lodash'),
    async = require('async'),
    multer = require('multer'),
    mongoose = require('mongoose'),
    settings = require('./../config').files;

function mongodbGet(id, fn) {
    var db = mongoose.connection.db;
    var id = new mongoose.mongo.ObjectID(id);
    var store = new mongoose.mongo.GridStore(db, id, "r", {root: "fs"});
    store.open(function(err, store) {
        if(err) {
            return fn(err);
        }
        if(store.filename === store.fileId && store.metadata && store.metadata.filename) {
            store.filename = store.metadata.filename;
        }
        fn(null, store);
    });
}

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
        putSingleFilesInArray: true,
        limits: {
            files: 1,
            fileSize: settings.maxFileSize
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
        .post(fileUpload, middlewares.cleanupFiles, function(req, res) {
            req.io.route('files:create');
        });

    app.route('/rooms/:room/files')
        .all(middlewares.requireLogin, middlewares.roomRoute)
        .get(function(req, res) {
            req.io.route('files:list');
        })
        .post(fileUpload, middlewares.cleanupFiles, function(req, res) {
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

                var url = core.files.getUrl(file);
                if (settings.provider === 'local') {
                    res.sendFile(url, {
                        headers: {
                            'Content-Type': file.type
                        }
                    });
                } else if (settings.provider === 'mongodb') {
                    mongodbGet(req.params.id, function(err, file) {
                        res.header("Content-Type", file.contentType);
                        res.header("Content-Length", file.length);
                        file.stream(true).pipe(res);
                    });
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
                    file: req.files.file[0],
                    post: (req.param('post') === 'true') && true
                };

            core.files.create(options, function(err, file) {
                if (err) {
                    console.error(err);
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
                    expand: req.param('expand')
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
