'use strict';

var fs = require('fs'),
    path = require('path');

function LocalFiles(options) {
    this.options = options;

    this.getUrl = this.getUrl.bind(this);
    this.save = this.save.bind(this);
}

LocalFiles.prototype.getUrl = function(file) {
    return path.resolve(this.options.dir + '/' + file._id);
};

LocalFiles.prototype.save = function(options, callback) {
    var file = options.file,
        doc = options.doc,
        fileFolder = doc._id,
        filePath = fileFolder + '/' + encodeURIComponent(doc.name),
        newPath = this.options.dir + '/' + fileFolder;

    this.copyFile(file.path, newPath, function(err) {

        if (err) {
            return callback(err);
        }

        // Let the clients know about the new file
        var url = '/files/' + filePath;
        callback(null, url, doc);
    });
};

LocalFiles.prototype.copyFile = function(path, newPath, callback) {
    fs.readFile(path, function(err, data) {
        if (err) {
            return callback(err);
        }

        fs.writeFile(newPath, data, function(err) {
            callback(err);
        });
    });
};

module.exports = LocalFiles;
