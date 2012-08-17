//
// Room
//
var RoomView = Backbone.View.extend({
    className: 'view',
    events: {
        'keypress .entry textarea': 'sendMessage'
    },
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
    },
    render: function() {
        var html = Mustache.to_html(this.template, this.model.toJSON());
        this.$el.html(html);
        this.$el.attr('data-id', this.model.id);
        this.$el.hide();
        this.$messages = this.$('.messages');
        return this.$el;
    },
    checkScrollLocked: function() {
        return false;
        // return this.$messages[0].scrollHeight - this.$messages.scrollTop() <= this.$messages.outerHeight();
    },
    scrollMessagesDown: function() {
        this.$messages.prop({
            scrollTop: this.$messages.prop('scrollHeight')
        });
    },
    addMessage: function(message, forceScroll) {
        var atBottom = this.checkScrollLocked();
        var html = Mustache.to_html(this.messageTemplate, message);
        this.$messages.append(html);
        if (atBottom && !message.multiple) {
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
// Tabs
//
var TabsView = Backbone.View.extend({
    el: '#rooms-menu ul',
    last: 'home',
    events: {
        'click .tab .close': 'tabclosed'
    },
    initialize: function() {
        this.template = $('#js-tmpl-tab').html()
        this.notifications = this.options.notifications
    },
    select: function(id) {
        this.$el.find('.tab[data-id=' + id + ']')
          .addClass('selected')
          .siblings().removeClass('selected');
    },
    setBadge: function(id, value) {
        this.$el.find('.tab[data-id=' + id + '] .badge').text(value)
    },
    add: function(room) {
        i = 0;
        var self = this;
        var tab = Mustache.to_html(this.template, room.toJSON());
        this.$el.append(tab);
        room.messages.bind('add', function(message) {
            self.setBadge(message.get('room'), i++);
        });
    },
    remove: function(id) {
        this.$el.find('.tab[data-id=' + id + ']').remove();
        this.last = this.$el.find('.tab:last').data('id');
    },
    tabclosed: function(e) {
        e.preventDefault();
        var $tab = $(e.currentTarget).closest('.tab');
        this.notifications.trigger('tabclosed', {
            id: $tab.data('id')
        });
    }
});

//
// Panes Manager
//
var PanesView = Backbone.View.extend({
    el: '#panes',
    current: '',
    views: {},
    initialize: function(templates) {
        this.notifications = this.options.notifications;
        this.tabs = new TabsView({
            notifications: this.notifications
        });
    },
    select: function(id) {
        this.current = id;
        this.tabs.select(id);
        this.$('.view').hide();
        this.$('.view[data-id=' + id + ']')
            .show()
            .siblings().hide();
    },
    add: function(view) {
        var $pane = view.render();
        this.tabs.add(view.model);
        this.views[view.model.id] = view;
        this.$el.append($pane);
    },
    remove: function(id) {
        if (this.current == id) {
            this.select(this.tabs.last)
        }
        this.tabs.remove(id);
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
        this.panes = new PanesView({
            notifications: this.notifications
        });
        //
        // New Room
        //
        this.rooms.bind('add', function(room) {
            self.panes.add(new RoomView({
                notifications: self.notifications,
                model: room
            }));
        });
        //
        // Leaving Room
        //
        this.rooms.bind('remove', function(room) {
            self.panes.remove(room.id);
        });
    },
    switchView: function(id) {
        if (id) {
            this.panes.select(id);
        } else {
            this.panes.select('home');
        }
    }
});