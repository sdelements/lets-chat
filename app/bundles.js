var crypto = require('crypto'),
    fs = require('fs'),
    _ = require('lodash'),
    yaml = require('js-yaml'),
    bundles = yaml.safeLoad(fs.readFileSync('bundles.yml', 'utf8')),
    settings = require('./config');

function getHash(path) {
    var file = fs.readFileSync(path);
    return crypto.createHash('md5').update(file, 'utf8').digest('hex');
}

function getTag(key, asset) {
    if (key.indexOf('_js') > -1) {
        return '<script type="text/javascript" src="' + asset + '"></script>';
    } else {
        return '<link rel="stylesheet" type="text/css" href="' + asset + '" />';
    }
}

function production(value, key) {
    var hash = getHash(value.dest);
    return [key, getTag(key, value.dest + '?md5=' + hash)];
}

function development(value, key) {
    var tags = value.src.map(function(asset) {
        if (asset.indexOf('socket.io.js') > -1) {
            asset ='socket.io/socket.io.js';
        }
        return getTag(key, asset);
    });

    return [key, tags.join('')];
}

var map = settings.env === 'production' ? production : development;

module.exports = _.object(_.map(bundles, map));
