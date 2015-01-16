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
            this.client = options.client;
            this.room = options.room;

            this.messages = new MessagesCollection();
            this.messageTemplate = Handlebars.compile($('#template-message').html());
            this.$messages = this.$('.messages');

            this.messages.bind('add', function(message) {
                this.addMessage(message);
            });

            this.$fromDate = this.$('#from-date');
            this.$toDate = this.$('#to-date');

            // Set initial from and to dates
            this.$fromDate.datepicker("setDate", new Date(moment().subtract(1, 'days')));
            this.$toDate.datepicker("setDate", new Date());

            this.loadTranscript();
        },

        getMessages: function(query, callback) {
            this.client.socket.emit('transcript:get', query, callback);
        },

        loadTranscript: function() {
            var self = this;
            this.$messages.html("")

            // Query for relevant messages and add them
            this.getMessages({
                room: this.room.id,
                fromDate: this.$fromDate.datepicker("getDate"),
                toDate: this.$toDate.datepicker("getDate"),
            }, function(messages) {
                _.each(messages, function(message) {
                    self.addMessage(message);
                })
            });
        },

        addMessage: function(message) {
            // Smells like pasta
            message.paste = /\n/i.test(message.text);
            // Fragment or new message?
            message.fragment = this.lastMessageOwner === message.owner.id;
            // Mine? Mine? Mine? Mine?
            message.own = this.client.user.id === message.owner.id;
            // WHATS MY NAME
            message.mentioned = new RegExp('\\B@(' + this.client.user.get('username') + ')(?!@)\\b', 'i').test(message.text)
            // Templatin' time
            var $html = $(this.messageTemplate(message).trim());
            var $text = $html.find('.lcb-message-text');
            if (message.paste) {
                $html.find('pre').each(function(i) {
                    hljs.highlightBlock(this);
                });
            } else {
                $text.html(this.formatMessage($text.html()));
            }
            $html.find('time').updateTimeStamp();
            this.$messages.append($html);
            this.lastMessageOwner = message.owner.id;
        },

        formatMessage: function(text) {
            return window.utils.message.format(text, this.client.extras || {});
        },
    });

}(window, $, _);