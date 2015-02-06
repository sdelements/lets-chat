'use strict';

+function(window, $, _) {

    window.LCB = window.LCB || {};

    window.LCB.TranscriptView = Backbone.View.extend({
        el: '#transcript',

        initialize: function(options) {
            this.options = options;
            this.room = options.room;

            this.$messages = this.$('.messages');
            this.messageTemplate =
                Handlebars.compile($('#template-message').html());

            var that = this;
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
            var format = 'YYYY-MM-DD';

            var that = this;

            function setRange(start, end) {
                that.startDate = moment(start).local().startOf('day');
                that.endDate = moment(end).local().endOf('day');
                that.loadTranscript();
            }

            setRange(moment(), moment());

            this.$daterange = $('input[name="daterange"]')
                .daterangepicker({
                    format: format,
                    startDate: this.startDate,
                    endDate: this.endDate,
                    dateLimit: { months: 1 }
                }, setRange);

            var str = that.startDate.format(format) + ' - ' + that.endDate.format(format);

            $('input[name="daterange"]').val(str);
        },

        loadTranscript: function() {
            this.clearMessages();

            var that = this;
            $.get('./messages', {
                room: this.room.id,
                from: moment(this.startDate).utc().toISOString(),
                to: moment(this.endDate).utc().toISOString(),
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
                            posted.diff(this.lastMessagePosted, 'minutes') < 5;

            // Mine? Mine? Mine? Mine?
            message.own = false; //this.client.user.id === message.owner.id;
            // WHATS MY NAME
            message.mentioned = false;// new RegExp('\\B@(' + this.client.user.get('username') + ')(?!@)\\b', 'i').test(message.text)
            // Templatin' time
            var $html = $(this.messageTemplate(message).trim());
            var $text = $html.find('.lcb-message-text');

            $text.html(this.formatMessage($text.html()));

            this.formatTimestamp($html.find('time'));
            this.$messages.append($html);
            this.lastMessageOwner = message.owner.id;
            this.lastMessagePosted = posted;
        },

        formatMessage: function(text) {
            return window.utils.message.format(text, this.formatData);
        },

        formatTimestamp: function($ele) {
            var time = $ele.attr('title');
            time = moment(time).format('ddd, MMM Do YYYY, h:mm:ss a');
            $ele.text(time);
        }
    });

}(window, $, _);
