'use strict';

+function(window, $, _) {

    window.LCB = window.LCB || {};

    window.LCB.TranscriptView = Backbone.View.extend({
        events: {
            'keyup .lcb-search-entry': 'search'
        },
        initialize: function(options) {

            var that = this;

            this.options = options;
            this.room = options.room;

            this.$messages = this.$('.lcb-transcript-messages');
            this.messageTemplate =
                Handlebars.compile($('#template-message').html());

            this.$query = this.$('.lcb-search-entry');

            $.when(
                $.get('./extras/emotes'), $.get('./extras/replacements')
            ).done(function(emotes, replacements) {
                that.formatData = {
                    emotes: emotes[0],
                    replacements: replacements[0]
                };
                that.setup();
            });

        },
        setup: function() {

            var that = this,
                format = 'MMMM D, YYYY',
                ranges = {
                    'Today': [moment(), moment()],
                    'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                    'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                    'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                }

            function setRange(start, end) {
                that.startDate = moment(start).local().startOf('day');
                that.endDate = moment(end).local().endOf('day');

                var str = that.startDate.format(format) + ' - ' + that.endDate.format(format);
                that.$('.lcb-transcript-daterange-range').html(str);

                that.loadTranscript();
            }

            setRange(moment(), moment());

            this.$daterange = this.$('.lcb-transcript-daterange')
                .daterangepicker({
                    format: format,
                    startDate: this.startDate,
                    endDate: this.endDate,
                    dateLimit: {
                        months: 1
                    },
                    ranges: ranges
                }, setRange);

            this.$query.jvFloat();

        },
        search: _.throttle(function() {
            this.query = this.$query.val()
            this.loadTranscript();
        }, 400, {leading: false}),
        loadTranscript: function() {
            var that = this;
            this.clearMessages();
            $.get('./messages', {
                room: this.room.id,
                from: moment(this.startDate).utc().toISOString(),
                to: moment(this.endDate).utc().toISOString(),
                query: this.query,
                expand: 'owner',
                reverse: false,
                take: 5000
            }, function(messages) {
                _.each(messages, function(message) {
                    that.addMessage(message);
                });
            });
        },
        clearMessages: function() {
            this.$messages.html('');
            delete this.lastMessageOwner;
            delete this.lastMessagePosted;
        },
        addMessage: function(message) {
            // Smells like pasta
            message.paste = /\n/i.test(message.text);

            var posted = moment(message.posted);

            // Fragment or new message?
            message.fragment = this.lastMessageOwner === message.owner.id &&
                            posted.diff(this.lastMessagePosted, 'minutes') < 2;

            // Templatin' time
            var $html = $(this.messageTemplate(message).trim());
            var $text = $html.find('.lcb-message-text');

            $text.html(this.formatMessage($text.html()));

            this.formatTimestamp($html.find('time'));
            this.$messages.append($html);

            if (!message.fragment) {
                this.lastMessageOwner = message.owner.id;
                this.lastMessagePosted = posted;
            }
        },
        formatMessage: function(text) {
            return window.utils.message.format(text, this.formatData);
        },
        formatTimestamp: function($el) {
            var time = moment($el.attr('title')).format('ddd, MMM Do YYYY, h:mm:ss a');
            $el.text(time);
        }
    });

}(window, $, _);
