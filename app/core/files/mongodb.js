var fs = require('fs'),
    path = require('path'),
    mongoose = require('mongoose');

function mongodbParse(options) {
    var opts = options;
    if(!opts.metadata) {
        opts.metadata = {};
    }
    return opts;
}

function mongodbPutFile(path, name, options, fn) {
    var db = mongoose.connection.db;
    options = mongodbParse(options);
    options.metadata.filename = name;
    return new mongoose.mongo.GridStore(db, name, "w", options).open(function(err, file) {
        if(err) {
            fn(err);
        }
        file.writeFile(path, fn);
    });
}

function MongoDBFiles(options) {
    this.options = options;

    this.getUrl = this.getUrl.bind(this);
    this.save = this.save.bind(this);
}

MongoDBFiles.prototype.getUrl = function(file) {
    return file._id;
};

MongoDBFiles.prototype.save = function(options, callback) {
    var file = options.file,
        doc = options.doc,
        fileFolder = doc._id,
        filePath = fileFolder + '/' + encodeURIComponent(doc.name);

    mongodbPutFile(file.path, fileFolder, {content_type: file.mimetype}, function(err, result) {
        if(err) {
            callback(err);
        }
        // Let the clients know about the new file
        var url = '/files/' + filePath;
        callback(null, url, doc);
    });

    return;
};

module.exports = MongoDBFiles;
