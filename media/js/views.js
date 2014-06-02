/*********************
 * Let's Chat Views
 *********************/

//
// Window & Notifications
//
var WindowView = Backbone.View.extend({
    el: 'html',
    initialize: function(options) {
        this.rooms = options.rooms;
        this.title = this.$('title').text();
        this.rooms.current.on('change:id', function(current, id) {
            var room = this.rooms.get(id);
            this.updateTitle(room && room.get('name') || id == 'list' && 'Rooms');
        }, this);
    },
    updateTitle: function(name) {
        var title;
        if (name) {
            title = $('<pre />').text(name).html() + ' &middot; ' + this.title ;
        } else {
            title = this.title;
        }
        this.$('title').html(title);
    }
});

 
//
// Rooms List
//
var BrowserView = Backbone.View.extend({
    initialize: function(options) {
        this.template = Handlebars.compile($('#template-room-browser-item').html());
        this.rooms = options.rooms;
        this.rooms.on('add', function(room) {
            this.$el.find('.lcb-rooms-list').append(this.template(room.toJSON()));
        }, this);
        this.rooms.on('change:name change:description', this.update, this);
    },
    update: function(room) {
        this.$el.find('.lcb-rooms-list-item[data-id=' + room.id + '] a').text(room.get('name'));
    }
});

//
// Tabs
//
var TabsView = Backbone.View.extend({
    events: {
        'click .lcb-tab-close': 'leave'
    },
    initialize: function(options) {
        this.client = options.client;
        this.template = Handlebars.compile($('#template-room-tab').html());
        this.rooms = options.rooms;
        this.rooms.on('change:joined', function(room, joined) {
            if (joined) {
                this.add(room.toJSON());
                return;
            }
            this.remove(room.id);
        }, this);
        this.rooms.on('change:name change:description', this.update, this);
        this.rooms.current.on('change:id', function(current, id) {
            this.switch(id);
        }, this);
        // Initial switch since router runs before view is loaded
        this.switch(this.rooms.current.get('id'));
    },
    add: function(room) {
        this.$el.append(this.template(room));
    },
    remove: function(id) {
        this.$el.find('.lcb-tab[data-id=' + id + ']').remove();
    },
    update: function(room) {
        this.$el.find('.lcb-tab[data-id=' + room.id + '] .lcb-tab-title').text(room.get('name'));
    },
    switch: function(id) {
        if (!id) {
            id = 'list';
        }
        this.$el.find('.lcb-tab').removeClass('selected')
            .filter('[data-id=' + id + ']').addClass('selected');
    },
    leave: function(e) {
        e.preventDefault();
        var id = $(e.currentTarget).closest('[data-id]').data('id');
        this.client.events.trigger('rooms:leave', id);
    },
});

//
// Panes
//
var PanesView = Backbone.View.extend({
    initialize: function(options) {
        this.client = options.client;
        this.template = Handlebars.compile($('#template-room').html());
        this.rooms = options.rooms;
        this.views = {};
        this.rooms.on('change:joined', function(room, joined) {
            if (joined) {
                this.add(room);
                return;
            }
            this.remove(room.id);
        }, this);
        // Switch room
        this.rooms.current.on('change:id', function(current, id) {
            this.switch(id);
        }, this);
    },
    switch: function(id) {
        if (!id) {
            id = 'list';
        }
        this.$el.find('.lcb-pane[data-id=' + id + ']').show()
            .siblings().hide();
        this.views[id] && this.views[id].scrollMessages(true);
    },
    add: function(room) {
        if (this.views[room.id]) {
            // Nothing to do, this room is already here
            return;
        }
        this.views[room.id] = new RoomView({
            client: this.client,
            template: this.template,
            model: room
        });
        this.$el.append(this.views[room.id].$el);
    },
    remove: function(id) {
        if (!this.views[id]) {
            // Nothing to do here
            return;
        }
        this.views[id].destroy();
        delete this.views[id];
    }
});

//
// Room
//
var RoomView = Backbone.View.extend({
    events: {
        'scroll .lcb-messages': 'updateScrollLock',
        'keypress .lcb-entry-input': 'sendMessage',
        'DOMCharacterDataModified .lcb-room-heading, .lcb-room-description': 'sendMeta'
    },
    initialize: function(options) {
        this.client = options.client;
        this.template = options.template;
        this.messageTemplate = Handlebars.compile($('#template-message').html());
        this.render();
        this.model.on('messages:new', this.addMessage, this);
        this.model.on('change', this.updateMeta, this);
    },
    render: function() {
        this.$el = $(this.template(this.model.toJSON()))
        this.$messages = this.$el.find('.lcb-messages');
        // Scroll Locking
        this.scrollLocked = true;
        this.$messages.on('scroll',  _.bind(this.updateScrollLock, this));
    },
    updateMeta: function(room, wat) {
        var $heading = this.$('.lcb-room-heading'),
            $description = this.$('.lcb-room-description');
        !$heading.is(':focus') && $heading.text(room.get('name'));
        !$description.is(':focus') && $description.text(room.get('description'))
    },
    sendMeta: function(e) {
        this.model.set({
            name: this.$('.lcb-room-heading').text(),
            description: this.$('.lcb-room-description').text()
        });
        this.client.events.trigger('rooms:update', {
            id: this.model.id,
            name: this.model.get('name'),
            description: this.model.get('description')
        });
    },
    sendMessage: function(e) {
        if (e.type === 'keypress' && e.keyCode !== 13 || e.altKey) return;
        e.preventDefault();
        var $textarea = this.$('.lcb-entry-input');
        if (!$textarea.val()) return;
        this.client.events.trigger('messages:send', {
            room: this.model.id,
            text: $textarea.val()
        });
        $textarea.val('');
    },
    addMessage: function(message) {
        // Smells like pasta
        message.paste = /\n/i.test(message.text);
        // Fragment or new message?
        message.fragment = this.lastMessageOwner === message.owner.id;
        // Mine? Mine? Mine? Mine?
        message.own = this.client.user.id === message.owner.id;
        // Templatin' time
        var $html = $(this.messageTemplate(message).trim());
        // var $text = $html.find('.text');
        // $text.html(this.formatContent($text.html()));
        if (message.paste) {
            $html.find('pre').each(function(i) {
                hljs.highlightBlock(this);
            });
        }
        this.$messages.append($html);
        this.lastMessageOwner = message.owner.id;
        this.scrollMessages();
    },
    updateScrollLock: function() {
        this.scrollLocked = this.$messages[0].scrollHeight -
          this.$messages.scrollTop() - 5 <= this.$messages.outerHeight();
        return this.scrollLocked;
    },
    scrollMessages: function(force) {
        if (!force && !this.scrollLocked)
            return;
        this.$messages[0].scrollTop = this.$messages[0].scrollHeight;
    },
    destroy: function() {
        this.undelegateEvents();
        this.$el.removeData().unbind();
        this.remove();
        Backbone.View.prototype.remove.call(this);
    }
});

//
// Client
//
var ClientView = Backbone.View.extend({
    el: '#lcb-client',
    initialize: function(options) {
        this.client = options.client;
        //
        // Subviews
        //
        this.window = new WindowView({
            rooms: this.client.rooms
        });
        this.browser = new BrowserView({
            el: this.$el.find('.lcb-rooms-browser'),
            rooms: this.client.rooms
        });
        this.tabs = new TabsView({
            el: this.$el.find('.lcb-tabs'),
            rooms: this.client.rooms,
            client: this.client
        });
        this.panes = new PanesView({
            el: this.$el.find('.lcb-panes'),
            rooms: this.client.rooms,
            client: this.client
        });
        return this;
    }
});