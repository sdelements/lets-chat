'use strict';

function PluginManager() {
    this.types = [
        'auth',
        'files'
    ];
}

PluginManager.prototype.getPlugin = function(key, type) {
    var name = 'lets-chat-' + key;
    var plugin = require(name);

    if (!type) {
        return plugin;
    }

    var Provider = plugin && plugin[type];
    if (Provider) {
        return Provider;
    }

    throw 'Module "' + name + '" is not a ' + type + ' provider';
};

module.exports = new PluginManager();
