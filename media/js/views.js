/*********************
 * Let's Chat Views
 *********************/

'use strict';

//
// Window & Notifications
//
var WindowView = Backbone.View.extend({
    el: 'html',
    keys: {
        'left+shift+alt right+shift+alt': 'nextRoom',
        'down+shift+alt up+shift+alt': 'recallRoom'
    },
    initialize: function(options) {
        this.client = options.client;
        this.rooms = options.rooms;
        this.originalTitle = this.$('title').text();
        this.title = this.originalTitle;
        this.focus = true;
        this.count = 0;
        this.mentions = 0;
        this.rooms.current.on('change:id', function(current, id) {
            var room = this.rooms.get(id);
            this.updateTitle(room && room.get('name') || id == 'list' && 'Rooms');
        }, this);
        this.rooms.on('change:name', function(room) {
            if (room.id !== this.rooms.current.get('id')) return;
            this.updateTitle(room.get('name'));
        }, this);
        this.rooms.on('messages:new', this.countMessage, this);
        $(window).on('focus blur', _.bind(this.focusBlur, this));
    },
    nextRoom: function(e) {
        var method = e.keyCode === 39 ? 'next' : 'prev',
            selector = e.keyCode === 39 ? 'first' : 'last',
            $next = this.$('.lcb-tabs').find('[data-id].selected')[method]();
        !$next.length > 0 && ($next = this.$('.lcb-tabs').find('[data-id]:' + selector));
        this.client.events.trigger('rooms:switch', $next.data('id'));
    },
    recallRoom: function() {
        this.client.events.trigger('rooms:switch', this.rooms.last.get('id'));
    },
    updateTitle: function(name) {
        if (name) {
            this.title = $('<pre />').text(name).html() + ' &middot; ' + this.originalTitle;
        } else {
            this.title = this.originalTitle;
        }
        this.$('title').html(this.title);
    },
    flashTitle: function() {
        var title = '(' + parseInt(this.count);
        this.mentions > 0 && (title += '/' + parseInt(this.mentions) + '@');
        title += ') ';
        this.$('title').html(this.titleTimerFlip ? this.title : title + this.title);
        this.titleTimerFlip = !this.titleTimerFlip;
    },
    countMessage: function(message) {
        if (this.focus || message.historical) return;
        ++this.count;
        if (new RegExp('\\B@(' + this.client.user.get('screenName') + ')(?!@)\\b', 'i').test(message.text)) {
            ++this.mentions;
        }
        if (!this.titleTimer) {
            this.flashTitle();
            this.titleTimer = setInterval(_.bind(this.flashTitle, this), 1 * 1000);
        }
    },
    focusBlur: function(e) {
        if (e.type === 'focus') {
            clearInterval(this.titleTimer);
            this.count = 0;
            this.mentions = 0;
            this.focus = true;
            this.$('title').html(this.title);
            this.titleTimer = false;
            this.titleTimerFlip = false;
            return;
        }
        this.focus = false;
    }
});

//
// Rooms List
//
var BrowserView = Backbone.View.extend({
    events: {
        'submit .lcb-rooms-add': 'add'
    },
    initialize: function(options) {
        this.client = options.client;
        this.template = Handlebars.compile($('#template-room-browser-item').html());
        this.rooms = options.rooms;
        this.rooms.on('add', function(room) {
            this.$el.find('.lcb-rooms-list').append(this.template(room.toJSON()));
        }, this);
        this.rooms.on('change:name change:description', this.update, this);
    },
    update: function(room) {
        this.$el.find('.lcb-rooms-list-item[data-id=' + room.id + '] .lcb-rooms-list-item-name').text(room.get('name'));
        this.$el.find('.lcb-rooms-list-item[data-id=' + room.id + '] .lcb-rooms-list-item-description').text(room.get('description'));
    },
    add: function(e) {
        e.preventDefault();
        var $name = this.$('.lcb-room-name');
        var $description = this.$('.lcb-room-description');
        var $modal = this.$('#lcb-add-room');
        var $form = this.$(e.target);
        var data = {
            name: $name.val().trim(),
            description: $description.val(),
            callback: function success() {
                $modal.modal('hide');
                $form.trigger('reset');
            }
        };

        // we require name is non-empty
        if (!data.name) {
            $name.parent().addClass('has-error');
            return;
        }

        this.client.events.trigger('rooms:create', data);
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
        // Room joining
        this.rooms.on('change:joined', function(room, joined) {
            if (joined) {
                this.add(room.toJSON());
                return;
            }
            this.remove(room.id);
        }, this);
        // Room meta updates
        this.rooms.on('change:name change:description', this.update, this);
        // Current room switching
        this.rooms.current.on('change:id', function(current, id) {
            this.switch(id);
            this.clearAlerts(id);
        }, this);
        // Alerts
        this.rooms.on('messages:new', this.alert, this);
        // Initial switch since router runs before view is loaded
        this.switch(this.rooms.current.get('id'));
        this.render();
    },
    render: function() {
        new Sortable(this.$el[0], {
            draggable: '.lcb-tab-room',
            ghostClass: 'lcb-tab-ghost'
        });
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
    alert: function(message) {
        var $tab = this.$('.lcb-tab[data-id=' + message.room + ']'),
            $total = $tab.find('.lcb-tab-alerts-total'),
            $mentions = $tab.find('.lcb-tab-alerts-mentions');
        if (message.historical || this.rooms.current.get('id') === message.room || $tab.length === 0) {
            // Nothing to do here!
            return;
        }
        var total = parseInt($tab.data('count-total')) || 0,
            mentions = parseInt($tab.data('count-mentions')) || 0;
        // All messages
        $tab.data('count-total', ++total);
        $total.text(total);
        // Just mentions
        if (new RegExp('\\B@(' + this.client.user.get('screenName') + ')(?!@)\\b', 'i').test(message.text)) {
            $tab.data('count-mentions', ++mentions);
            $mentions.text(mentions);
        }
    },
    clearAlerts: function(id) {
        var $tab = this.$('.lcb-tab[data-id=' + id + ']'),
            $total = $tab.find('.lcb-tab-alerts-total'),
            $mentions = $tab.find('.lcb-tab-alerts-mentions');
        $tab.data('count-total', 0).data('count-mentions', 0);
        $total.text('');
        $mentions.text('');
    }
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
        // Initial switch since router runs before view is loaded
        this.switch(this.rooms.current.get('id'));
    },
    switch: function(id) {
        if (!id) {
            id = 'list';
        }
        var $pane = this.$el.find('.lcb-pane[data-id=' + id + ']');
        $pane.show().siblings().hide();
        $pane.find('.lcb-entry-input').focus();
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
// Room Users
//
var RoomUsersView = Backbone.View.extend({
    initialize: function(options) {
        this.template = Handlebars.compile($('#template-user').html());
        this.collection.on('add remove', function() {
            this.count();
        }, this);
        this.collection.on('add', function(user) {
            this.add(user.toJSON());
        }, this);
        this.collection.on('remove', function(user) {
            this.remove(user.id);
        }, this);
        this.render();
    },
    render: function() {
        this.collection.each(function(user) {
            this.add(user.toJSON());
        }, this);
        this.count();
    },
    add: function(user) {
        this.$('.lcb-room-sidebar-list').prepend(this.template(user));
    },
    remove: function(id) {
        this.$('.lcb-room-sidebar-user[data-id=' + id + ']').remove();
    },
    count: function(users) {
        this.$('.lcb-room-sidebar-users-count').text(this.collection.length);
    }
});

//
// Room
//
var RoomView = Backbone.View.extend({
    events: {
        'scroll .lcb-messages': 'updateScrollLock',
        'keypress .lcb-entry-input': 'sendMessage',
        'DOMCharacterDataModified .lcb-room-heading, .lcb-room-description': 'sendMeta',
        'click .lcb-room-toggle-sidebar': 'toggleSidebar'
    },
    initialize: function(options) {
        this.client = options.client;
        this.template = options.template;
        this.messageTemplate = Handlebars.compile($('#template-message').html());
        this.render();
        this.model.on('messages:new', this.addMessage, this);
        this.model.on('change', this.updateMeta, this);
        //
        // Subviews
        //
        this.usersList = new RoomUsersView({
            el: this.$('.lcb-room-sidebar-users'),
            collection: this.model.users
        });
    },
    render: function() {
        this.$el = $(this.template(this.model.toJSON()))
        this.$messages = this.$('.lcb-messages');
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
    deleteRoom: function(e) {
        this.client.events.trigger('rooms:delete', this.model.id);
    },
    sendMessage: function(e) {
        if (e.type === 'keypress' && e.keyCode !== 13 || e.altKey) return;
        e.preventDefault();
        if (!this.client.status.get('connected')) return;
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
        // WHATS MY NAME
        message.mentioned = new RegExp('\\B@(' + this.client.user.get('screenName') + ')(?!@)\\b', 'i').test(message.text)
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
        this.$messages.append($html);
        this.lastMessageOwner = message.owner.id;
        this.scrollMessages();
    },
    formatMessage: function(text) {
        return window.utils.message.format(text, this.plugins);
    },
    updateScrollLock: function() {
        this.scrollLocked = this.$messages[0].scrollHeight -
          this.$messages.scrollTop() - 5 <= this.$messages.outerHeight();
        return this.scrollLocked;
    },
    scrollMessages: _.debounce(function(force) {
        if (!force && !this.scrollLocked)
            return;
        this.$messages[0].scrollTop = this.$messages[0].scrollHeight;
    }, 0),
    toggleSidebar: function(e) {
        e && e.preventDefault && e.preventDefault();
        this.$el.toggleClass('lcb-room-sidebar-opened');
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
var StatusView = Backbone.View.extend({
    initialize: function(options) {
        var that = this;
        this.client = options.client;
        this.client.status.on('change:connected', function(status, connected) {
            that.$el.find('[data-status="connected"]').toggle(connected);
            that.$el.find('[data-status="disconnected"]').toggle(!connected);
        });
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
        this.browser = new BrowserView({
            el: this.$el.find('.lcb-rooms-browser'),
            rooms: this.client.rooms,
            client: this.client
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
        this.window = new WindowView({
            rooms: this.client.rooms,
            client: this.client
        });
        this.status = new StatusView({
            el: this.$el.find('.lcb-status-indicators'),
            client: this.client
        });
        this.client.status.once('change:connected', _.bind(function(status, connected) {
            this.$el.find('.lcb-client-loading').hide(connected);
        }, this));
        return this;
    }
});
