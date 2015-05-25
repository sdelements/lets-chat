'use strict';

var fs = require('fs'),
    _ = require('lodash'),
    async = require('async'),
    onFinished = require('on-finished');

function cleanupReqFiles(req, cb) {
    if (!req.files) {
        return cb();
    }

    var files = _.chain(req.files)
             .map(function(x) { return x; })
             .flatten()
             .value();

    async.each(files, function(file, callback) {
        fs.stat(file.path, function(err, stats) {
			if (!err && stats.isFile()) {
                fs.unlink(file.path, function(e) {
                    if (e) {
                        console.error(e);
                    }

                    callback();
                });
            }
        });
    });
}

module.exports = function(req, res, next) {
	res.on('error', function() {
        cleanupReqFiles(req);
	});

    onFinished(res, function () {
        cleanupReqFiles(req);
    });

    next();
};
