'use strict';

var mongoose = require('mongoose'),
    helpers = require('./helpers');

function UserManager(options) {
    this.core = options.core;
}

UserManager.prototype.list = function(options, cb) {
    options = options || {};

    options = helpers.sanitizeQuery(options, {
        defaults: {
            take: 500
        },
        maxTake: 5000
    });

    var User = mongoose.model('User');

    var find = User.find();

    if (options.skip) {
        find.skip(options.skip);
    }

    if (options.take) {
        find.limit(options.take);
    }

    find.exec(cb);
};

module.exports = UserManager;
