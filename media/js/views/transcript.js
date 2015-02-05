'use strict';

+function(window, $, _) {

    window.LCB = window.LCB || {};

    window.LCB.TranscriptView = Backbone.View.extend({
        el: '#transcript',

        events: {
            'click .load-transcript': 'loadTranscript',
        },

        initialize: function(options) {
            this.options = options;
            this.room = options.room;

            this.$messages = this.$('.messages');
            this.messageTemplate =
                Handlebars.compile($('#template-message').html());

            this.initializeDatepickers();

            var that = this;
            $.when(
                $.get('/extras/emotes'), $.get('/extras/replacements')
            ).done(function(emotes, replacements) {
                that.formatData = {
                    emotes: emotes[0],
                    replacements: replacements[0]
                };
                that.loadTranscript();
            });
        },

        initializeDatepickers: function() {
            var from = moment().subtract(1, 'days').toDate(),
                to = moment().toDate();

            this.$fromDate = this.$('#from-date');
            this.$toDate = this.$('#to-date');
            // Set initial from and to dates
            this.$fromDate.datepicker("setDate", from);
            this.$toDate.datepicker("setDate", to);
        },

        getMessages: function(query, callback) {
            $.get('/messages', query, callback);
        },

        loadTranscript: function() {
            var self = this;
            this.$messages.html('');

            var from = moment(this.$fromDate.datepicker("getDate"))
                .utc()
                .toISOString();

            var to = moment(this.$toDate.datepicker("getDate"))
                .add(1, 'day')
                .subtract(1, 'second')
                .utc()
                .toISOString();


            // Query for relevant messages and add them
            this.getMessages({
                room: this.room.id,
                from: from,
                to: to,
                include: 'owner,room'
            }, function(messages) {
                _.each(messages, function(message) {
                    self.addMessage(message);
                });
            });
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

            $html.find('time').updateTimeStamp();
            this.$messages.append($html);
            this.lastMessageOwner = message.owner.id;
            this.lastMessagePosted = posted;
        },

        formatMessage: function(text) {
            return window.utils.message.format(text, this.formatData);
        }
    });

}(window, $, _);
