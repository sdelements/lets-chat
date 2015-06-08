'use strict';

var mongoose = require('mongoose'),
    settings = require('./../config').avatars;

function AvatarManager(options) {

    this.core = options.core;

    var Provider = require('./avatars/gravatar');

    this.provider = new Provider(settings[settings.provider]);

}

AvatarManager.prototype.add = function(query, cb) {

}

AvatarManager.prototype.get = function(query, cb) {

    this.fetch(query, function(err, avatar) {

        typeof cb === 'function' && cb(null, avatar);

    });

};

AvatarManager.prototype.fetch = function(query, cb) {

    var User = mongoose.model('User');

    if (typeof cb !== 'function') {
        cb = function() {};
    }

    User.findByIdentifier(query.id, function(err, user) {

        if (err) {
            console.error(err);
            return cb(err);
        }

        if (!user) {
            return cb('User does not exist.');
        }

        query.size = query.size ? parseInt(query.size) : 50;

        this.provider.fetch(user, query, cb);

    }.bind(this));

};


module.exports = AvatarManager;
