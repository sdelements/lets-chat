'use strict';

var _ = require('lodash'),
    mongoose = require('mongoose'),
    helpers = require('./helpers'),
    plugins = require('./../plugins'),
    settings = require('./../config').files;

var enabled = settings.enable;

function FileManager(options) {
    this.core = options.core;

    if (!enabled) {
        return;
    }

    var Provider;

    if (settings.provider === 'local') {
        Provider = require('./files/local');
    } else {
        Provider = plugins.getPlugin(settings.provider, 'files');
    }

    this.provider = new Provider(settings[settings.provider]);
}

FileManager.prototype.create = function(options, cb) {
    if (!enabled) {
        return cb('Files are disabled.');
    }

    var File = mongoose.model('File'),
        Room = mongoose.model('Room'),
        User = mongoose.model('User');

    if (settings.restrictTypes &&
        settings.allowedTypes &&
        settings.allowedTypes.length &&
        !_.includes(settings.allowedTypes, options.file.mimetype)) {
            return cb('The MIME type ' + options.file.mimetype +
                      ' is not allowed');
    }

    Room.findById(options.room, function(err, room) {

        if (err) {
            console.error(err);
            return cb(err);
        }
        if (!room) {
            return cb('Room does not exist.');
        }
        if (room.archived) {
            return cb('Room is archived.');
        }
        if (!room.isAuthorized(options.owner)) {
            return cb('Not authorized.');
        }

        new File({
            owner: options.owner,
            name: options.file.originalname,
            type: options.file.mimetype,
            size: options.file.size,
            room: options.room
        }).save(function(err, savedFile) {
            if (err) {
                return cb(err);
            }

            this.provider.save({file: options.file, doc: savedFile}, function(err) {
                if (err) {
                    savedFile.remove();
                    return cb(err);
                }

                // Temporary workaround for _id until populate can do aliasing
                User.findOne(options.owner, function(err, user) {
                    if (err) {
                        console.error(err);
                        return cb(err);
                    }

                    cb(null, savedFile, room, user);

                    this.core.emit('files:new', savedFile, room, user);

                    if (options.post) {
                        this.core.messages.create({
                            room: room,
                            owner: user.id,
                            text: 'upload://' + savedFile.url
                        });
                    }
                }.bind(this));
            }.bind(this));
        }.bind(this));
    }.bind(this));
};

FileManager.prototype.list = function(options, cb) {
    var Room = mongoose.model('Room');

    if (!enabled) {
        return cb(null, []);
    }

    options = options || {};

    if (!options.room) {
        return cb(null, []);
    }

    options = helpers.sanitizeQuery(options, {
        defaults: {
            reverse: true,
            take: 500
        },
        maxTake: 5000
    });

    var File = mongoose.model('File');

    var find = File.find({
        room: options.room
    });

    if (options.from) {
        find.where('uploaded').gt(options.from);
    }

    if (options.to) {
        find.where('uploaded').lte(options.to);
    }

    if (options.expand) {
        var includes = options.expand.replace(/\s/, '').split(',');

        if (_.includes(includes, 'owner')) {
            find.populate('owner', 'id username displayName email avatar');
        }
    }

    if (options.skip) {
        find.skip(options.skip);
    }

    if (options.reverse) {
        find.sort({ 'uploaded': -1 });
    } else {
        find.sort({ 'uploaded': 1 });
    }

    Room.findById(options.room, function(err, room) {
        if (err) {
            console.error(err);
            return cb(err);
        }

        var opts = {
            userId: options.userId,
            password: options.password
        };

        room.canJoin(opts, function(err, canJoin) {
            if (err) {
                console.error(err);
                return cb(err);
            }

            if (!canJoin) {
                return cb(null, []);
            }

            find
                .limit(options.take)
                .exec(function(err, files) {
                    if (err) {
                        console.error(err);
                        return cb(err);
                    }
                    cb(null, files);
                });
        });
    });
};

FileManager.prototype.getUrl = function(file) {
    if (!enabled) {
        return;
    }

    return this.provider.getUrl(file);
};

module.exports = FileManager;
