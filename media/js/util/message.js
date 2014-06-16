'use strict';

if (typeof window !== 'undefined' && typeof exports === 'undefined') {
    if (typeof window.utils !== 'object') window.utils = {};
}

if (typeof exports !== 'undefined') {
    var _ = require('underscore');
}

(function(exports) {
    //
    // Message Text Formatting
    //
    exports.format = function(text, extras) {
        var imagePattern = /^\s*((https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;'"!()]*[-A-Z0-9+&@#\/%=~_|][.](jpe?g|png|gif))\s*$/i,
            linkPattern = /((https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;'"!()]*[-A-Z0-9+&@#\/%=~_|])/ig,
            mentionPattern = /\B@(\w+)(?!@)\b/g;
        text = text.trim();
        text = text.replace(mentionPattern, '<strong>@$1</strong>');
        if (imagePattern.test(text)) {
            text = text.replace(imagePattern, function(url) {
                url = _.escape(url);
                return '<a class="thumbnail" href="' + url + '" target="_blank"><img src="' + url + '" alt="Pasted Image" /></a>'
            });
        } else {
            text = text.replace(linkPattern, function(url) {
                url = _.escape(url);
                return '<a href="' + url + '" target="_blank">' + url + '</a>';
            });
        }
        return text;
    }
})(typeof exports === 'undefined' ? window.utils.message = {} : exports);