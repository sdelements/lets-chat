
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
    exports.format = function(text, plugins) {
        // TODO: Fix these regexes
        var imagePattern = /((https?|ftp):\/\/[^\s\/$.?#].[^\s]*[.](jpe?g|png|gif)\s*$)/gi;
        var linkPattern = /((https?|ftp):\/\/[^\s\/$.?#].[^\s]*[^.])/gi;
        if (text.match(imagePattern)) {
            text = text.replace(imagePattern, '<a class="thumbnail" href="$1" target="_blank"><img src="$1" alt="$1" /></a>');
        } else {
            text = text.replace(linkPattern, '<a href="$1" target="_blank">$1</a>');
        }
        if (plugins) {
            // emotes
            _.each(plugins.emotes, function(emote, keyword) {
                var image = '<img class="emote" src="' + encodeURI(emote) + '" title="'+ encodeURI(keyword) + '" alt="' + encodeURI(keyword) + '" />';
                text = text.replace(new RegExp('\\B' + keyword + '\\b', 'g'), image);
            });
            // replacements
            _.each(plugins.replacements, function(replacement) {
                text = text.replace(new RegExp(replacement.regex, 'g'), replacement.template);
            });
        }
        return text;
    }
})(typeof exports === 'undefined' ? window.utils.message = {} : exports);