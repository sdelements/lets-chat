var _ = require('lodash'),
    fs = require('fs'),
    yaml = require('js-yaml');

var defaults = yaml.safeLoad(fs.readFileSync('defaults.yml', 'utf8'));

module.exports = _.merge(defaults,
    yaml.safeLoad(fs.readFileSync('settings.yml', 'utf8'))
);
