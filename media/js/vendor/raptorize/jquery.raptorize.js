/*
* jQuery Raptorize Plugin
* @acrogenesis
* Free to use under the MIT license.
* http://www.opensource.org/licenses/mit-license.php
*/
$(document).ready(function() {
    $("body").raptorize();
});
(function($) {

    //Stupid Browser Checking which should be in jQuery
    jQuery.browser = {};
    jQuery.browser.mozilla = /mozilla/.test(navigator.userAgent.toLowerCase()) && !/webkit/.test(navigator.userAgent.toLowerCase());
    jQuery.browser.webkit = /webkit/.test(navigator.userAgent.toLowerCase());

    $.fn.raptorize = function(options) {
        //Yo' defaults
        var defaults = {
            enterOn: 'konami-code', //timer, konami-code, click
            delayTime: 5000 //time before raptor attacks on timer mode
        };

        //Extend those options
        var options = $.extend(defaults, options);
        return this.each(function() {
            var _this = $(this);
            var audioSupported = false;

            // DISABLED AUDIO SUPPORT

            // if ($.browser.mozilla || $.browser.webkit) {
            //     audioSupported = true;
            // }

            //Raptor Vars (Modify the 'src' to your prefrence)
            var raptorImageMarkup = '<img id="elRaptor" style="display: none" src="./media/js/vendor/raptorize/raptor.png" />'
            var raptorAudioMarkup = '<audio id="elRaptorShriek" preload="auto"><source src="./media/js/vendor/raptorize/raptor-sound.mp3" /><source src="./media/js/vendor/raptorize/raptor-sound.ogg" /></audio>';
            var locked = false;

            //Append Raptor and Style
            $('body').append(raptorImageMarkup);
            if(audioSupported) { $('body').append(raptorAudioMarkup); }
            var raptor = $('#elRaptor').css({
                "position":"fixed",
                "bottom": "-300px",
                "right" : "0",
                "display" : "none"
            });

            // Animating Code
            function init() {
                locked = true;
                $(window).scrollTop(9999999);
                var raptor = $('#elRaptor').css({"display" : "block"});
                //Sound Hilarity
                if(audioSupported) {
                    function playSound() {
                        document.getElementById('elRaptorShriek').play();
                    }
                    playSound();
                }

                // Movement Hilarity
                raptor.animate({
                    "bottom" : "0px"
                }, function() {
                    $(this).animate({
                        "bottom" : "0px"
                    }, 100, function() {
                        var offset = (($(this).position().left)+400);
                        $(this).delay(300).animate({
                            "right" : offset
                        }, 2200, function() {
                            locked = false;
                        })
                    });
                });
            }


            if(options.enterOn == 'timer') {
                setTimeout(init, options.delayTime);
            } else if(options.enterOn == 'click') {
                _this.bind('click', function(e) {
                    e.preventDefault();
                    if(!locked) {
                        init();
                    }
                })
            } else if(options.enterOn == 'konami-code'){
                var kkeys = [], konami = "38,38,40,40,37,39,37,39,66,65";
                $(window).bind("keydown.raptorz", function(e){
                    kkeys.push( e.keyCode );
                    if ( kkeys.toString().indexOf( konami ) >= 0 ) {
                        init();
                        $(window).unbind('keydown.raptorz');
                    }
                });
            }
        });//each call
    }//orbit plugin call
})(jQuery);
