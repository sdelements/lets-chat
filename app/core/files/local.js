var fs = require('fs'),
    settings = require('./../../config').files;

var moveFile = function(path, newPath, callback) {
    fs.readFile(path, function(err, data) {
        if (err) {
            return callback(err);
        }

        fs.writeFile(newPath, data, function(err) {
            callback(err);
        });
    });
};

module.exports = {

    enabled: settings.enable && settings.provider === 'local',

    getUrl: function(file) {
        return settings.local.upload_dir + '/' + file._id;
    },

    save: function(options, callback) {
        var file = options.file,
            doc = options.doc,
            fileFolder = doc._id,
            filePath = fileFolder + '/' + encodeURIComponent(doc.name);

        moveFile(file.path,
                settings.local.upload_dir + '/' + fileFolder, function(err) {

            if (err) {
                return callback(err);
            }

            // Let the clients know about the new file
            var url = '/files/' + filePath;
            callback(null, url, doc);
        });
    }

};
