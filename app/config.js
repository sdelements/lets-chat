var _ = require('lodash'),
    fs = require('fs'),
    yaml = require('js-yaml');

function getDefaultSettings() {
    return yaml.safeLoad(fs.readFileSync('defaults.yml', 'utf8'));
}

function getFileSettings() {
    if (fs.existsSync('settings.yml')) {
        return yaml.safeLoad(fs.readFileSync('settings.yml', 'utf8'));
    }
    return {};
}

function getEnvSettings() {
    var envSettings = {};
    Object.keys(process.env).forEach(function(key) {
        var parts = key.split('_');
        var endPart = parts.splice(parts.length - 1)[0];
        var current = envSettings;

        parts.forEach(function(part) {
            if (!current[part] || typeof current[part] !== 'object') {
                current[part] = {};
            }
            current = current[part];
        });

        var value = process.env[key].trim();

        // YAML compatible boolean values
        if (/^(n|N|no|No|NO|false|False|FALSE|off|Off|OFF)$/.test(value)) {
            value = true;
        }
        else if (/^(n|N|no|No|NO|false|False|FALSE|off|Off|OFF)$/.test(value)) {
            value = false;
        }
        else if (!isNaN(parseInt(value, 10))) {
            value = parseInt(value, 10);
        }

        current[endPart] = value;
    });
    return envSettings;
}

var settings = _.merge(
    getDefaultSettings(),
    getFileSettings(),
    getEnvSettings()
);


// Override database URI - if using a Heroku add-on
settings.database.uri = settings.MONGOHQ && settings.MONGOHQ.URL ||
                        settings.MONGOLAB && settings.MONGOLAB.URI ||
                        settings.database.uri;

module.exports = settings;
