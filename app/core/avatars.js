'use strict';

var mongoose = require('mongoose'),
    streamifier = require('streamifier'),
    lwip = require('lwip'),
    colorHash = new (require('color-hash'));

var settings = require('./../config').avatars;

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

    query.size = query.size ? parseInt(query.size) : 50;

    User.findByIdentifier(query.id, function(err, user) {

        if (err) {
            console.error(err);
            return cb(err);
        }

        if (!user) {
            return cb('User does not exist.');
        }

        this.provider.fetch(user, query, function(err, avatar) {

            if (err) {
                console.error(err);
                return cb(err);
            }

            if (!avatar) {

                var colors = colorHash.rgb(user.email || user.id);

                lwip.create(query.size, query.size, colors, function(err, image) {
                    image.toBuffer('jpg', function(err, buffer) {
                        cb(null, streamifier.createReadStream(buffer));
                    });
                });

                return;

            }

            cb(err, avatar);

        });

    }.bind(this));

};


module.exports = AvatarManager;
