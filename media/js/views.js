//
// Roomlist
//
var RoomListView = Backbone.View.extend({
    el: '#room-list',
    initialize: function() {
        var self = this;
        this.$list = this.$('.room-list');
        this.template = $('#js-tmpl-room-list-item').html();
        this.userTemplate = $('#js-tmpl-room-list-user').html();
        this.collection = this.options.collection;
        this.collection.bind('add', function(room) {
            self.add(room);
            //
            // Room meta update
            //
            room.bind('change', function(room) {
                self.updateRoom(room.toJSON());
            });
            //
            //  User events
            //
            room.users.bind('add', function(user) {
                self.addUser(user.toJSON());
            });
            room.users.bind('remove', function(user) {
                self.removeUser(user.toJSON());
            });
        });
        this.collection.bind('remove', function(room) {
            self.remove(room.id);
        });
        this.collection.bind('reset', function() {
            self.empty();
        });
        self.$list.masonry({
            itemSelector: '.room',
            isAnimated: true
        });
        // Masonry shim
        this.options.notifications.on('homeselected', function() {
            self.$list.masonry('reload');
        });
    },
    add: function(room) {
        var item = Mustache.to_html(this.template, room.toJSON());
        this.$list.prepend(item);
        this.$list.masonry('reload');
    },
    remove: function(id) {
        this.$('.room[data-id=' + id + ']').remove();
        this.$list.masonry('reload');
    },
    addUser: function(user) {
        var html = Mustache.to_html(this.userTemplate, user);
        this.$('.room[data-id=' + user.room + '] .users').prepend(html);
        this.$list.masonry('reload');
    },
    removeUser: function(user) {
        this.$('.room[data-id=' + user.room + ']')
          .find('.user[data-id=' + user.id + ']').remove();
        this.$list.masonry('reload');
    },
    updateRoom: function(room) {
        var $room = this.$('.room[data-id=' + room.id + ']');
        $room.find('.name').text(room.name);
        $room.find('.description').text(room.description);
    },
    empty: function() {
        this.$list.empty();
    }
});

//
// Userlist
//
var UserListView = Backbone.View.extend({
    initialize: function() {
        var self = this;
        this.template = $('#js-tmpl-user-item').html();
        this.model.bind('add', function(user) {
            self.add(user.toJSON());
        });
        this.model.bind('remove', function(user) {
            self.remove(user.id);
        });
        this.model.bind('reset', function() {
            self.empty();
        });
    },
    add: function(user) {
        var html = Mustache.to_html(this.template, user);
        this.$el.append(html);
    },
    remove: function(id) {
        this.$('.user[data-id=' + id + ']').remove();
    },
    empty: function() {
        this.$el.empty();
    }
});

//
// Room
//
var RoomView = Backbone.View.extend({
    className: 'view',
    events: {
        'click .entry .send': 'sendMessage',
        'keypress .entry textarea': 'sendMessage',
        'submit .edit-room form': 'submitEditRoom',
        'click .delete-room': 'deleteRoom',
        'click .show-edit-room': 'showEditRoom',
        'click .hide-edit-room': 'hideEditRoom'
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
        this.user = this.options.user;
        //
        // Subviews
        this.userlist = new UserListView({
            notifications: this.notifications,
            model: this.model.users
        });
        //
        // Model Bindings
        //
        this.model.bind('change:name', function(room, name) {
            self.updateName(name);
        });
        this.model.bind('change:description', function(room, description) {
            self.updateDescription(description);
        });
        this.model.messages.bind('add', function(message) {
            self.addMessage(message.toJSON());
        });
        this.model.messages.bind('addsilent', function(message) {
            // We're debouncing the scrolldown for performance
            self.addMessage(message, true);
        });
        this.model.users.bind('add', function(user, users) {
            //
            // Nick Complete
            //
            self.$('.entry textarea').nicknameTabComplete({
                nicknames: _.pluck(users.toJSON(), 'safeName')
            });
        });
        //
        // Window Events
        //
        $(window).on('resize', function() {
            // Flex shim
            // This is runs even if not visible
            // TODO: Make this better
            self.updateLayout();
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
        // Set subview elements
        //
        this.userlist.setElement(this.$('.user-list'));
        //
        // Message Scroll Lock
        //
        this.$messages.on('scroll', function() {
            self.updateScrollLock();
        });
        return this.$el;
    },
    updateLayout: function() {
        //
        // CSS Flex shim for non-webkit browsers
        //
        if ($.browser.webkit !== true) {
            var height = $(window).height() -
                $('header.navbar').outerHeight() -
                parseInt(this.$('.chat').css('margin-top'), 10) -
                parseInt(this.$('.chat').css('margin-bottom'), 10) -
                this.$('.entry').outerHeight();
            this.$messages.height(height);
        }
    },
    updateScrollLock: function() {
        this.scrollLocked = this.$messages[0].scrollHeight -
          this.$messages.scrollTop() - 5 <= this.$messages.outerHeight();
        return this.scrollLocked;
    },
    scrollMessagesDown: function(debounce) {
        var self = this;
        var scrollDown = function() {
            self.$messages.prop({
                scrollTop: self.$messages.prop('scrollHeight')
            });
        };
        // Just scroll down if no debounce
        if (!debounce) {
            return scrollDown();
        }
        // Set our debounced instance if its not set
        if (!this.debouncedScrollDown) {
            this.debouncedScrollDown = _.debounce(function(debounce) {
                scrollDown();
            }, 40);
        }
        // Debounce bro
        return this.debouncedScrollDown(debounce);
    },
    formatContent: function(text) {
        // TODO: Fix these regexes
        var imagePattern = /(^\s*(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|][.](jpe?g|png|gif)\s*$)/gim;
        var linkPattern =  /((https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])\b/gim;
        if (text.match(imagePattern)) {
            text = text.replace(imagePattern, '<a class="thumbnail" href="$1" target="_blank"><img src="$1" alt="$1" /></a>');
        } else {
            text = text.replace(linkPattern, '<a href="$1" target="_blank">$1</a>');
        }
        return text;
    },
    addMessage: function(message, debounce) {
        if (this.lastMessageUser === message.owner) {
            message.fragment = true;
        }
        // I think this has my name on it
        if (this.user.id === message.owner) {
            message.own = true;
        }
        // Check to see if we've been mentioned
        if (message.text.match(new RegExp('\\@' + this.user.get('safeName') + '\\b', 'i'))) {
            message.mentioned = true;
        }
        // Smells like pasta
        if (message.text.match(/\n/ig)) {
            message.paste = true;
        }
        var $html = $(Mustache.to_html(this.messageTemplate, message));
        var $text = $html.find('.text');
        $text.html(this.formatContent($text.html()));
        this.$messages.append($html);
        this.lastMessageUser = message.owner;
        if (this.scrollLocked) {
            this.scrollMessagesDown(debounce);
        }
    },
    sendMessage: function(e) {
        if (e.type === 'keypress' && e.keyCode !== 13) return;
        e.preventDefault();
        $textarea = this.$('.entry textarea');
        this.notifications.trigger('newmessage', {
            room: this.model.id,
            text: $.trim($textarea.val())
        });
        $textarea.val('');
    },
    showEditRoom: function(e) {
        var self = this;
        if (e) {
            e.preventDefault();
        }
        this.$('.modal-backdrop').fadeIn(100).one('click', function() {
            self.hideEditRoom(e);
        });
        this.$('.edit-room').modal({
            backdrop: false
        });
    },
    hideEditRoom: function(e) {
        if (e) {
            e.preventDefault();
        }
        this.$('.modal-backdrop').fadeOut(200);
        this.$('.edit-room').modal('hide');
    },
    submitEditRoom: function(e) {
        e.preventDefault();
        var name = this.$('.edit-room input[name="name"]').val();
        var description = this.$('.edit-room textarea[name="description"]').val();
        this.notifications.trigger('updateroom', {
            id: this.model.id,
            name: name,
            description: description
        });
        this.hideEditRoom();
    },
    deleteRoom: function(e) {
        e.preventDefault();
        var serious = confirm('Do you really want to to delete "' + this.model.get('name') +  '"?');
        if (serious === true) {
            this.notifications.trigger('deleteroom', this.model.id);
        }
    },
    updateName: function(name) {
        this.$('.sidebar .meta .name').text(name);
        this.$('.edit-room input[name="name"]').val(name);
    },
    updateDescription: function(description) {
        this.$('.sidebar .meta .description').text(description);
        this.$('.edit-room textarea[name="description"]').val(description);
    }
});

//
// Tabs Menu
//
var TabsMenuView = Backbone.View.extend({
    el: '#rooms-menu ul',
    curent: 'home',
    events: {
        'click .tab .close': 'tabclosed'
    },
    initialize: function() {
        var self = this;
        this.template = $('#js-tmpl-tab').html();
        this.notifications = this.options.notifications;
        //
        // Room meta update
        //
        this.notifications.on('roomupdate', function(room) {
            self.update({
                id: room.id,
                title: room.name
            });
        });
        //
        //
        // Tab count badges
        //
        this.notifications.on('addmessage', function(message) {
            if (message.room !== self.current) {
                var $tab = self.$tab(message.room);
                var count = parseInt($tab.data('count'));
                count = count ? count : 0;
                $tab.data('count', ++count);
                self.setBadge(message.room, count);
            }
        });
    },
    render: function() {
        //
        // Tab size fix
        //
        var $tabs = this.$('.tab:not(.fixed)');
        $tabs.width(100 / $tabs.length + '%');
    },
    $tab: function(id) {
        return this.$('.tab[data-id=' + id + ']');
    },
    select: function(id) {
        this.current = id;
        this.$tab(id)
          .addClass('selected')
          .data('count', 0) // Reset tab alert count
          .siblings().removeClass('selected');
        this.setBadge(id, 0);
    },
    setBadge: function(id, value) {
        var $badge = this.$tab(id).find('.badge');
        if (value === 0) {
            $badge.hide();
            return;
        }
        this.$tab(id).find('.badge').show().text(value);
    },
    add: function(room) {
        var self = this;
        var tab = Mustache.to_html(this.template, room.toJSON());
        this.$el.append(tab);
        this.render();
    },
    remove: function(id) {
        this.$tab(id).remove();
        this.last = this.$('.tab:last').data('id');
        this.render();
    },
    update: function(data) {
        this.$tab(data.id).find('.title').text(data.title);
    },
    tabclosed: function(e) {
        e.preventDefault();
        var $tab = $(e.currentTarget).closest('.tab');
        this.notifications.trigger('tabclosed', {
            id: $tab.data('id')
        });
    },
    next: function(id) {
        var $tab = this.$tab(id);
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
        if (this.views[id]) {
            // Does CSS Flex shim
            this.views[id].updateLayout();
            // Sometimes scroll position gets messed up
            this.views[id].scrollMessagesDown();
        }
        // Trigger masonry fix event if home
        if (id === 'home') {
            this.notifications.trigger('homeselected');
        }
    },
    add: function(view) {
        var self = this;
        var $pane = view.render();
        var room = view.model;
        this.menu.add(room);
        this.views[room.id] = view;
        this.$el.append($pane);
    },
    remove: function(id) {
        if (this.current === id) {
            var next = this.menu.next(id);
            this.select(next);
            this.notifications.trigger('navigate', next);
        }
        this.menu.remove(id);
        this.views[id].remove();
        delete this.views[id];
    }
});

//
// Create Room
//
var CreateRoomView = Backbone.View.extend({
    el: '#create-room',
    initialize: function() {
        this.notifications = this.options.notifications;
    },
    events: {
        'click .create': 'createRoom'
    },
    clear: function() {
        this.$('input[type="text"], textarea').val('');
    },
    show: function() {
        this.$el.modal('show');
    },
    hide: function() {
        this.$el.modal('hide');
    },
    createRoom: function() {
        var room = {
            name: this.$('input[name="name"]').val(),
            description: this.$('textarea[name="description"]').val()
        };
        this.clear();
        this.hide();
        this.notifications.trigger('createroom', room);
        return false;
    }
});

//
// Window Message Count
//
var WindowCountAlertView = Backbone.View.extend({
    el: 'html',
    title: $('title').html(),
    focus: true,
    count: 0,
    initialize: function() {
        var self = this;
        $(window).bind('focus blur', function(e) {
            if (e.type === 'focus') {
                self.count = 0;
                self.focus = true;
                //
                // TODO: Title needs Room name or something
                //
                self.$('title').html(self.title);
                // Clean up Fluid.app dock badge
                if (window.fluid !== undefined) {
                    window.fluid.dockBadge = undefined;
                }
            } else {
                self.focus = false;
            }
        });
        this.options.notifications.on('addmessage', function(message) {
            // Nothing to do here if focused
            if (self.focus) return;
            //
            // Update Window Title
            //
            self.$('title').html('(' + parseInt(++self.count) + ') ' + self.title);
            //
            // Notifications on the for Fluid.app users.
            //
            if (window.fluid === undefined) return;
            window.fluid.dockBadge = self.count;
            window.fluid.showGrowlNotification({
                title: 'Let\'s Chat',
                description: message.text,
                priority: 1,
                sticky: false
            });
        });
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
        this.user = this.options.user;
        this.availableRooms = this.options.availableRooms;
        this.rooms = this.options.rooms;
        this.notifications = this.options.notifications;
        //
        // Subviews
        //
        this.roomList = new RoomListView({
            collection: this.availableRooms,
            notifications: this.notifications
        });
        this.tabs = new TabsView({
            notifications: this.notifications
        });
        this.createRoom = new CreateRoomView({
            notifications: this.notifications
        });
        this.windowCountAlert = new WindowCountAlertView({
            notifications: this.notifications
        });
        //
        // Connection Events
        //
        this.notifications.on('connect', function() {
            self.$('.connection-status')
                .removeClass('disconnected')
                .addClass('connected')
                .html('connected');
        });
        this.notifications.on('disconnect', function() {
            self.$('.connection-status')
              .removeClass('connected')
              .addClass('disconnected')
              .html('disconnected');
        });
        //
        // Room events
        //
        this.rooms.bind('add', function(room) {
            self.tabs.add(new RoomView({
                notifications: self.notifications,
                user: self.user,
                model: room
            }));
        });
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
