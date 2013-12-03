//
// Roomlist
//
var TranscriptView = Backbone.View.extend({
    el: '#transcript',
    events: {
        'change .mentioned-filter input': 'toggleMentionFilter'
    },
    initialize: function(options) {
        var self = this;
        //
        // Models
        //
        this.messages = new MessagesCollection();
        //
        // Templates
        //
        this.messageTemplate = $('#js-tmpl-message').html();
        //
        // Get them plugins
        //
        this.plugins = {};
        $.get('/plugins/replacements.json', function(json) {
            self.plugins.replacements = json;
        });
        $.get('/plugins/emotes.json', function(json) {
            self.plugins.emotes = json;
        });
        //
        // Model Events
        //
        this.messages.bind('add', function(message) {
            self.addMessage(message.toJSON());
        });
        //
        // Populate messages
        //
        _.each(options.messages.reverse(), function(message) {
            self.messages.add(message);
        });
    },
    formatContent: function(text) {
        return window.utils.message.format(text, this.plugins);
    },
    addMessage: function(message) {
        //
        // TODO: We can probably abstract the next few lines as well
        //
        if (this.lastMessageUser === message.owner) {
            message.fragment = true;
        }
        if (this.options.user.id === message.owner) {
            message.own = true;
        }
        if (message.text.match(new RegExp('\\@' + this.options.user.safeName + '\\b', 'i'))) {
            message.mentioned = true;
        }
        if (message.text.match(/\n/ig)) {
            message.paste = true;
        }
        var $html = $(Mustache.to_html(this.messageTemplate, message).trim());
        var $text = $html.find('.text');
        $text.html(this.formatContent($text.html()));
        this.$('.messages').append($html);
        this.lastMessageUser = message.owner;
    },
    toggleMentionFilter: function(e) {
        var $target = $(e.currentTarget);
        var checked = $target.attr('checked');
        if (checked) {
            this.$('.message').not('.mentioned').hide();
            this.$('.mentioned.fragment').removeClass('fragment').addClass('-fragment');
        } else {
            this.$('.message').show();
            this.$('.-fragment').removeClass('.-fragment').addClass('fragment');
        }
    }
});
