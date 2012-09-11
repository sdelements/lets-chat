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
            //  User events
            //
            room.users.bind('add', function(user) {
                self.addUser(user.toJSON())
            });
            room.users.bind('remove', function(user) {
                self.removeUser(user.toJSON())
            })
        });
        this.collection.bind('remove', function(room) {
            self.remove(room.id);
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
        var html = Mustache.to_html(this.userTemplate, user)
        this.$('.room[data-id=' + user.room + '] .users').prepend(html);
        this.$list.masonry('reload');
    },
    removeUser: function(user) {
        this.$('.room[data-id=' + user.room + ']')
          .find('.user[data-id=' + user.id + ']').remove();
        this.$list.masonry('reload');
    }
});

//
// Userlist
//
var UserListView = Backbone.View.extend({
    // tagName: 'ul',
    // className: 'user-list',
    initialize: function() {
        var self = this;
        this.template = $('#js-tmpl-user-item').html();
        this.model.bind('add', function(user) {
            self.add(user.toJSON());
        });
        this.model.bind('remove', function(user) {
            self.remove(user.id);
        });
    },
    add: function(user) {
        var html = Mustache.to_html(this.template, user);
        this.$el.append(html);
    },
    remove: function(id) {
        this.$('.user[data-id=' + id + ']').remove();
    }
});

//
// Room
//
var RoomView = Backbone.View.extend({
    className: 'view',
    events: {
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
        //
        // Subviews
        this.userlist = new UserListView({
            notifications: this.notifications,
            model: this.model.users
        });
        //
        // Model Bindings
        //
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
        }
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
        var imagePattern = /^(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|][.](jpe?g|png|gif))\b$/gim;
        var linkPattern =  /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
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
        if (e.keyCode != 13) return;
        e.preventDefault();
        $textarea = $(e.currentTarget);
        this.notifications.trigger('newmessage', {
            room: this.model.id,
            text: $.trim($textarea.val())
        });
        $textarea.val('');
    },
    showEditRoom: function(e) {
        var self = this;
        e.preventDefault;
        this.$('.modal-backdrop').fadeIn(100).one('click', function() {
          self.hideEditRoom(e);
        })
        this.$('.edit-room').modal({
            backdrop: false
        });
    },
    hideEditRoom: function(e) {
        e.preventDefault;
        this.$('.modal-backdrop').fadeOut(200);
        this.$('.edit-room').modal('hide');
    },
    submitEditRoom: function(e) {
        e.preventDefault();
    },
    deleteRoom: function(e) {
        e.preventDefault();
        var serious = confirm('Do you really want to to delete "' + this.model.get('name') +  '"?');
        if (serious === true) {
            this.notifications.trigger('deleteroom', this.model.id);
        }
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
        this.template = $('#js-tmpl-tab').html()
        this.notifications = this.options.notifications
        //
        // Tab count badges
        //
        this.notifications.on('addmessage', function(message) {
            if (message.room != self.current) {
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
        if (value == 0) {
            $badge.hide();
            return;
        }
        this.$tab(id).find('.badge').show().text(value)
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
        //
        // Room Events
        //
        room.messages.bind('add', function(message) {
        });
    },
    remove: function(id) {
        if (this.current == id) {
            var next = this.menu.next(id);
            this.select(next)
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
    }
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
            if (e.type == 'focus') {
                self.count = 0;
                self.focus = true;
            } else {
                self.focus = false;
            }
        });
        this.options.notifications.on('addmessage', function() {
            if (!self.focus) {
                self.$('title').html('(' + parseInt(++self.count) + ') ' + self.title);
            }
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
        // Joined Room
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
