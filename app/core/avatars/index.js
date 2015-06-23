'use strict';

var _ = require('lodash'),
    fallback = require('fallback'),
    mongoose = require('mongoose');

var plugins = require('./../../plugins');

var settings = require('./../../config').avatars;

function AvatarManager(options) {

    this.options = options;

    this.providers = settings.providers.map(function(key) {

        var Provider;

        if (_.includes(['gravatar', 'initials'], key)) {
            Provider = require('./' + key);
        } else {
            Provider = plugins.getPlugin(key, 'avatar');
        }

        return {
            key: key,
            provider: new Provider(settings[key])
        };

    });

}

AvatarManager.prototype.add = function(query, cb) {

    cb();

};

AvatarManager.prototype.fetch = function(query, cb) {

    var User = mongoose.model('User');

    if (typeof cb !== 'function') {
        cb = function() {};
    }

    query.size = query.size ? parseInt(query.size) : 50;

    User.findByIdentifier(query.id, function(err, user) {

        if (err) {
            console.error(err);
            return cb(err);
        }

        if (!user) {
            return cb();
        }

        fallback(this.providers, function(p, callback) {

            var provider = p.provider;

            provider.fetch(user, query, function(err, avatar) {

                if (err) {
                    console.error(err);
                    return callback(err);
                }

                if (!avatar) {
                    return callback();
                }

                return callback(null, avatar);

            });

        }, function(err, avatar) {

            if (err) {
                console.error(err);
            }

            cb(err, avatar);

        });

    }.bind(this));

};

module.exports = AvatarManager;
