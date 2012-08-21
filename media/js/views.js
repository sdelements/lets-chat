//
// Room
//
var RoomView = Backbone.View.extend({
    className: 'view',
    events: {
        'keypress .entry textarea': 'sendMessage'
    },
    lastMessageUser: false,
    scrollLocked: true,
    initialize: function() {
        var self = this;
        //
        // Vars
        //
        this.template = $('#js-tmpl-room').html();
        this.messageTemplate = $('#js-tmpl-message').html();
        this.notifications = this.options.notifications;
        //
        // Model Bindings
        //
        this.model.messages.bind('add', function(message) {
            self.addMessage(message.toJSON());
        });
        this.model.messages.bind('addsilent', function(message) {
            self.addMessage(message, true);
        });
    },
    render: function() {
        var self = this;
        var html = Mustache.to_html(this.template, this.model.toJSON());
        this.$el.html(html);
        this.$el.attr('data-id', this.model.id);
        this.$el.hide();
        this.$messages = this.$('.messages');
        //
        // Message Scroll Lock
        //
        this.$messages.on('scroll', function() {
            self.updateScrollLock();
        });
        return this.$el;
    },
    updateScrollLock: function() {
        this.scrollLocked = this.$messages[0].scrollHeight -
          this.$messages.scrollTop() - 5 <= this.$messages.outerHeight();
        return this.scrollLocked;
    },
    scrollMessagesDown: function() {
        this.$messages.prop({
            scrollTop: this.$messages.prop('scrollHeight')
        });
    },
    formatContent: function(text) {
        // TODO: Fix this regex
        var imagePattern = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|][.](jpe?g|png|gif))\b/gim;
        var linkPattern =  /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
        if (text.match(imagePattern)) {
            text = text.replace(imagePattern, '<a class="thumbnail" href="$1" target="_blank"><img src="$1" alt="$1" /></a>');
        } else {
            text = text.replace(linkPattern, '<a href="$1" target="_blank">$1</a>');
        }
        return text;
    },
    addMessage: function(message, noScroll) {
        if (this.lastMessageUser === message.owner) {
            message.fragment = true;
        }
        var $html = $(Mustache.to_html(this.messageTemplate, message));
        var $text = $html.find('.text');
        $text.html(this.formatContent($text.text()));
        this.$messages.append($html);
        this.lastMessageUser = message.owner;
        if (this.scrollLocked && !noScroll) {
            console.log('herp');
            this.scrollMessagesDown();
        }
    },
    sendMessage: function(e) {
        if (e.keyCode != 13) return;
        e.preventDefault();
        $textarea = $(e.currentTarget);
        this.notifications.trigger('newmessage', {
            room: this.model.id,
            text: $.trim($textarea.val())
        });
        $textarea.val('');
    }
});

//
// Tabs Menu
//
var TabsMenuView = Backbone.View.extend({
    el: '#rooms-menu ul',
    events: {
        'click .tab .close': 'tabclosed'
    },
    initialize: function() {
        this.template = $('#js-tmpl-tab').html()
        this.notifications = this.options.notifications
    },
    render: function() {
        //
        // Tab size fix
        //
        var $tabs = this.$('.tab:not(.fixed)');
        $tabs.width(100 / $tabs.length + '%');
    },
    select: function(id) {
        this.$('.tab[data-id=' + id + ']')
          .addClass('selected')
          .siblings().removeClass('selected');
    },
    setBadge: function(id, value) {
        this.$('.tab[data-id=' + id + '] .badge').text(value)
    },
    add: function(room) {
        var self = this;
        var tab = Mustache.to_html(this.template, room.toJSON());
        this.$el.append(tab);
        this.render();
    },
    remove: function(id) {
        this.$el.find('.tab[data-id=' + id + ']').remove();
        this.last = this.$el.find('.tab:last').data('id');
        this.render();
    },
    tabclosed: function(e) {
        e.preventDefault();
        var $tab = $(e.currentTarget).closest('.tab');
        this.notifications.trigger('tabclosed', {
            id: $tab.data('id')
        });
    },
    next: function(id) {
        var $tab = this.$('.tab[data-id=' + id + ']');
        return $tab.next().length > 0 ? $tab.next().data('id') : $tab.prev().data('id');
    }
});

//
// Panes Manager
//
var TabsView = Backbone.View.extend({
    el: '#panes',
    current: '',
    views: {},
    initialize: function(templates) {
        this.notifications = this.options.notifications;
        this.menu = new TabsMenuView({
            notifications: this.notifications
        });
    },
    select: function(id) {
        this.current = id;
        this.menu.select(id);
        this.$('.view').hide();
        this.$('.view[data-id=' + id + ']')
            .show()
            .siblings().hide();
        if (this.views[id].scrollLocked) {
            this.views[id].scrollMessagesDown();
        }
    },
    add: function(view) {
        var self = this;
        var $pane = view.render();
        var room = view.model;
        this.menu.add(room);
        this.views[room.id] = view;
        this.$el.append($pane);
        //
        // Room Events
        //
        room.messages.bind('add', function(message) {
        });
    },
    remove: function(id) {
        if (this.current == id) {
            this.select(this.menu.next(id))
        }
        this.menu.remove(id);
        this.views[id].remove();
        delete this.views[id];
    }
});

//
// Client
//
var ClientView = Backbone.View.extend({
    el: '#client',
    initialize: function() {
        var self = this;
        //
        // Vars
        //
        this.rooms = this.options.rooms;
        this.notifications = this.options.notifications;
        //
        // Subviews
        //
        this.tabs = new TabsView({
            notifications: this.notifications
        });
        //
        // New Room
        //
        this.rooms.bind('add', function(room) {
            self.tabs.add(new RoomView({
                notifications: self.notifications,
                model: room
            }));
        });
        //
        // Leaving Room
        //
        this.rooms.bind('remove', function(room) {
            self.tabs.remove(room.id);
        });
    },
    switchView: function(id) {
        if (id) {
            this.tabs.select(id);
        } else {
            this.tabs.select('home');
        }
    }
});