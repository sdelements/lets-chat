'use strict';

if (typeof window !== 'undefined' && typeof exports === 'undefined') {
    if (typeof window.utils !== 'object') {
        window.utils = {};
    }
}

+function(window, $, _, moment, store, exports) {

    function jp(text) {

        var stored = store.get('raptorize');
        var now = moment();

        var raptorize = !stored || now.isAfter(stored);

        if (raptorize) {
            var t = text.toLowerCase();

            var quotes = [
                'clever girl',
                'shoot her! shoot her!',
                'hold on to your butts',
                'spared no expense',
                'life finds a way',
                'it\'s a unix system! i know this!'
            ];

            var doIt = _.some(quotes, function(quote) {
                if (t.indexOf(quote) > -1) {
                    return true;
                }
                return false;
            });

            if (doIt) {
                store.set('raptorize', moment().add(2, 'hours').format());

                $(window).raptorize({
                    'enterOn' : 'timer',
                    'delayTime' : 0
                });
            }
        }

        return text;
    }

    exports.message = function(text, extras, rooms) {
        var pipeline = [
            jp
        ];

        _.each(pipeline, function(func) {
            text = func(text);
        });
    };


}(window, $, _, moment, store, window.utils.eggs = {});
