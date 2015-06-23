'use strict';

var _ = require('lodash');

var colorHash = new (require('color-hash'));

function AvatarProvider(options) {

    this.options = options;

}

AvatarProvider.prototype.fetch = function(user, query, cb) {

    var colors = colorHash.rgb(user.email || user.id);

    var svg =
        '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' +
        '<svg xmlns="http://www.w3.org/2000/svg" pointer-events="none" width="50" height="50" ' +
        'style="width: 50px; height: 50px; background-color: rgb(' + colors[0] + ', ' + colors[1] + ', ' + colors[2] + ');">' +
            '<text text-anchor="middle" y="50%" x="50%" dy="0.36em" pointer-events="auto" fill="#ffffff" ' +
            'font-family="HelveticaNeue-Light,Helvetica Neue Light,Helvetica Neue,Helvetica, Arial,Lucida Grande, sans-serif" ' +
            'style="font-weight: 400; font-size: 22px;">' + _.escape(user.firstName[0] + user.lastName[0]).toUpperCase() + '</text>' +
        '</svg>';

    cb(null, {
        type: 'image/svg+xml',
        raw: svg
    });

};

module.exports = AvatarProvider;
