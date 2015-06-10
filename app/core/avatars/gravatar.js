'use strict';

var _ = require('lodash'),
    gravatar = require('gravatar'),
    request = require('request');

function Gravatar(options) {

    this.options = options;

}

Gravatar.prototype.fetch = function(user, query, cb) {

    var url = gravatar.url(user.email, {
        s: query.size || 50,
        d: 404
    }, true);

    var stream = request({
        url: url,
        encoding: null
    }).on('error', function(err) {
        cb(err);
    }).on('response', function(res) {
        if (!_.contains([200, 301, 302], res.statusCode)) {
            cb();
            return;
        }
        cb(null, res);
    });

}

module.exports = Gravatar;