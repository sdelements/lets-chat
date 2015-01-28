var knox = require('knox'),
    settings = require('./../../config').files;


module.exports = {

    enabled: settings.enable && settings.provider === 's3',

    getUrl: function(file) {
        var filePath = file._id + '/' + encodeURIComponent(file.name);
        var url = 'https://' + settings.s3.bucket + '.s3-' +
                  settings.s3.region + '.amazonaws.com/' + filePath;
    },

    save: function(options, callback) {
        var file = options.file,
            doc = options.doc,
            fileFolder = doc._id,
            filePath = fileFolder + '/' + encodeURIComponent(doc.name);

        var client = knox.createClient({
            key: settings.s3.accessKeyId,
            secret: settings.s3.secretAccessKey,
            region: settings.s3.region,
            bucket: settings.s3.bucket
        });

        client.putFile(file.path, '/' + decodeURIComponent(filePath), {
            'Content-Type': file.type,
            'Content-Length': file.size
        }, function (err, response) {
            if (err) {
                return callback(err);
            }

            if (response.statusCode !== 200) {
                return callback(
                    'There was a problem with the server\'s S3 credentials.'
                );
            }

            var url = 'https://' + client.urlBase + '/' + filePath;
            callback(null, url, doc);
        });
    }

};
