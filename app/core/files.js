'use strict';

var fs = require('fs'),
    _ = require('lodash'),
    mongoose = require('mongoose'),
    settings = require('./../config').files,
    enabled = settings.enable,
    provider = _.find([
        require('./files/local'),
        require('./files/s3')
    ], function(provider) { return provider.enabled; });

function FileManager(options) {
    this.core = options.core;
}

FileManager.prototype.create = function(options, cb) {
    var File = mongoose.model('File'),
    Room = mongoose.model('Room'),
    User = mongoose.model('User');

    if (!enabled) {
        return cb('Files are disabled.');
    }

    if (settings.allowed_file_types &&
        settings.allowed_file_types.length &&
        !_.include(settings.allowed_file_types, options.file.type)) {
            return cb('The MIME type ' + options.file.type + ' is not allowed');
    }

    Room.findById(options.room, function(err, room) {
        if (err) {
            console.error(err);
            return cb(err);
        }
        if (room.archived) {
            return cb('Room is archived.');
        }

        new File({
            owner: options.owner,
            name: options.file.name,
            type: options.file.type,
            size: options.file.size,
            room: options.room
        }).save(function(err, savedFile) {
            provider.save({file: options.file, doc: savedFile}, function(err) {
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

                }.bind(this));
            }.bind(this));
        }.bind(this));
    }.bind(this));
};

FileManager.prototype.list = function(options, cb) {
    var File = mongoose.model('File'),
    User = mongoose.model('User');

    var find = File.find();

    if (options.room) {
        find.where('room', options.room);
    }

    find
    .populate('owner', 'id username displayName email avatar')
    .limit(options.limit || 500)
    .sort({ 'uploaded': -1 })
    .exec(function(err, files) {
        if (err) {
            console.error(err);
            return cb(err);
        }
        cb(null, files);
    });
};

FileManager.getUrl = provider ? provider.getUrl : function(){};

module.exports = FileManager;
