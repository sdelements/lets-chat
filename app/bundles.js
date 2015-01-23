var fs = require('fs'),
    _ = require('lodash'),
    yaml = require('js-yaml'),
    bundles = yaml.safeLoad(fs.readFileSync('bundles.yml', 'utf8')),
    settings = require('./config');

function getTag(key, asset) {
    if (key.indexOf('_js') > -1) {
        return '<script type="text/javascript" src="' + asset + '"></script>';
    } else {
        return '<link rel="stylesheet" type="text/css" href="' + asset + '" />';
    }
}

function production(value, key) {
    return [key, getTag(key, value.dest)];
}

function development(value, key) {
    var tags = value.src.map(function(asset) {
        return getTag(key, asset);
    });

    return [key, tags.join('')];
}

var map = settings.env === 'production' ? production : development;

module.exports = _.object(_.map(bundles, map));
