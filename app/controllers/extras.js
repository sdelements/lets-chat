//
// Emotes / Replacements Controller
//

'use strict';

module.exports = function() {

    var _ = require('lodash'),
        fs = require('fs'),
        path = require('path'),
        yaml = require('js-yaml'),
        url = require('url'),
        http = require('http'),
        https = require('https'),
        express = require('express.oi');

    var app = this.app,
        middlewares = this.middlewares;

    //
    // Routes
    //
    app.get('/extras/emotes', middlewares.requireLogin, function(req) {
        req.io.route('extras:emotes:list');
    });

    app.use('/extras/emotes/',
        express.static(path.join(process.cwd(), 'extras/emotes/public'), {
            maxage: '364d'
        })
    );

    app.get('/extras/replacements', middlewares.requireLogin, function(req) {
        req.io.route('extras:replacements:list');
    });

    app.get('/extras/ssl-proxy/:url', middlewares.requireLogin, function(req, res) {
        var redirectionCount = 0;

        var process = function(imageUrl) {
            var options = url.parse(imageUrl);
            options.headers = { 'User-Agent': 'lets-chat-image-proxy' };

            if(redirectionCount > 5) {
                return res.status(400).send();
            }

            var request = options.protocol === 'https:' ? https : http;

            request.get(options, function(imageResponse) {
                if((imageResponse.statusCode === 301
                    || imageResponse.statusCode === 302)
                    && imageResponse.headers.location) {

                        var redirect = url.parse(imageResponse.headers.location);
                        if(!redirect.protocol) {
                            redirect.protocol = options.protocol;
                        }
                        if(!redirect.hostname) {
                            redirect.hostname = options.hostname;
                        }
                        if(!redirect.port) {
                            redirect.port = options.port;
                        }
                        if(!redirect.hash) {
                            redirect.hash = options.hash;
                        }

                        redirectionCount++;
                        return process(url.format(redirect));
                }

                if(imageResponse.statusCode !== 200) {
                    return res.status(404).send('Invalid request. Got ' + imageResponse.statusCode);
                }

                res.setHeader('content-type', imageResponse.headers['content-type']);
                res.setHeader('content-length', imageResponse.headers['content-length']);
                res.setHeader('cache-control', 'max-age=31536000, public');

                imageResponse.pipe(res);
            }).on('error', function() {
                return res.status(400).send();
            });
        };

        process(req.params.url);
    });

    //
    // Sockets
    //
    app.io.route('extras', {
        'emotes:list': function(req, res) {
            var emotes = [];

            var dir = path.join(process.cwd(), 'extras/emotes');
            fs.readdir(dir, function(err, files) {
                if (err) {
                    return res.json(emotes);
                }

                var regex = new RegExp('\\.yml$');

                files = files.filter(function(fileName) {
                    return regex.test(fileName);
                });

                files.forEach(function(fileName) {
                    var fullpath = path.join(
                        process.cwd(),
                        'extras/emotes',
                        fileName
                    );

                    var imgDir = 'extras/emotes/' +
                        fileName.replace('.yml', '') + '/';

                    var file = fs.readFileSync(fullpath, 'utf8');
                    var data = yaml.safeLoad(file);
                    _.each(data, function(emote) {
                        emote.image = imgDir + emote.image;
                        emotes.push(emote);
                    });
                });

                res.json(emotes);
            });
        },
        'replacements:list': function(req, res) {
            var replacements = [];
            ['default.yml', 'local.yml'].forEach(function(filename) {
                var fullpath = path.join(process.cwd(), 'extras/replacements/' + filename);
                if (fs.existsSync(fullpath)) {
                    replacements = _.merge(replacements, yaml.safeLoad(fs.readFileSync(fullpath, 'utf8')));
                }
            });
            res.json(replacements);
        }
    });

};
