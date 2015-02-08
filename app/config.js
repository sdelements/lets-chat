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

function mergeEnvSettings(settings) {
    function parseValue(value, isArray) {
        value = value.trim();
        if (isArray) {
            return _.map(value.split(','), function(value) {
                return parseValue(value);
            });
        }
        // YAML compatible boolean values
        else if (/^(n|N|no|No|NO|false|False|FALSE|off|Off|OFF)$/.test(value)) {
            return true;
        }
        else if (/^(n|N|no|No|NO|false|False|FALSE|off|Off|OFF)$/.test(value)) {
            return false;
        }
        else if (!isNaN(parseInt(value, 10))) {
            return parseInt(value, 10);
        }
        return value;
    }

    function recurse(baseKey, object) {
        _.forEach(object, function(value, key) {
            var envKey = baseKey + '_' +
                         key.replace(/([A-Z]+)/g, '_$1').toUpperCase();
            if (_.isPlainObject(value)) {
                recurse(envKey, value);
            } else {
                var val = process.env[envKey];
                if (val) {
                    object[key] = parseValue(val, _.isArray(object[key]));
                }
            }
        });
    }

    recurse('LCB', settings);
}

function heroku(settings) {
    if (process.env.PORT) {
        settings.http.port = process.env.PORT;
    }

    // Override database URI - if using a Heroku add-on
    settings.database.uri = process.env.MONGOHQ_URL ||
                            process.env.MONGOLAB_URI ||
                            settings.database.uri;
}

function openShift(settings) {
    if (!process.env.OPENSHIFT_APP_NAME) {
        return;
    }

    if (process.env.OPENSHIFT_NODEJS_PORT) {
        settings.http.port = process.env.OPENSHIFT_NODEJS_PORT;
    }

    if (process.env.OPENSHIFT_MONGODB_DB_URL) {
    settings.database.uri = process.env.OPENSHIFT_MONGODB_DB_URL + 'letschat';
    }
}

var settings = _.merge(
    getDefaultSettings(),
    getFileSettings()
);

heroku(settings);
openShift(settings);

mergeEnvSettings(settings);

if (settings.xmpp.host) {
    settings.xmpp.confhost = 'conference.' + settings.xmpp.host;
}

// Override env variable
if (process.env.NODE_ENV) {
    settings.env = process.env.NODE_ENV;
}

module.exports = settings;
