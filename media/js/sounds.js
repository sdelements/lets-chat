function SoundSystem(options) {
    this.init = function () {
        var that = this;
        this.settings = {
            sfx_volume: SFX.VOLUME,
            sfx_url: SFX.URL,
        };
        // TODO: Move library to its own file
        this.library = {
            sfx: SFX.LIBRARY
        };
        // Handle GUI
        // TODO: Move + Clean this
        $('.adjust-sound').each(function () {
            // Init sliders
            $(this).slider({
                orientation: 'horizontal',
                range: 'min',
                min: 0,
                max: 100,
                value: 50,
                slide: function () {
                    // TODO: whuah?
                    console.log();
                }
            });
            // Set initial slider state
            if ($(this).hasClass('sfx')) {
                $(this).slider('value', that.settings.sfx_volume);
                $('.current-volume.sfx').text(that.settings.sfx_volume);
            }
            // Bind slider change
            $(this).bind('slide slidestop', function () {
                var value = $(this).slider('value');
                if ($(this).hasClass('sfx')) {
                    audio.setVolume('sfx', value);
                    $('.current-volume.sfx').text(value);
                    $.cookie('sfx_volume', value);
                }
            });
        });
    };

    this.init();

    this.play = function (sound) {
        var sfx = this.library.sfx;
        // Do we have this sound?
        if (sfx[sound]) {
            var soundObject = soundManager.getSoundById(sound);
            if (soundObject) {
                soundObject.play({ volume: this.settings.sfx_volume });
            } else {
                // Create missing sounds
                soundManager.createSound({
                    volume: this.settings.sfx_volume,
                    id: sound,
                    url: this.settings.sfx_url + sfx[sound],
                    autoLoad: true,
                    autoPlay: true
                });
            }
        } else {
            console.log('Invalid sound: ' + sound);
        }
    };

    this.setVolume = function (type, value) {
        // TODO: Add sanity check for volume int
        if (type === 'sfx') {
            this.settings.sfx_volume = value;
        }
    };
}

