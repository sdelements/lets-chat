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
            self.add(_.extend(room.toJSON(), {
                lastActive: moment(room.get('lastActive')).calendar()
            }));
            //
            // Room meta update
            //
            room.bind('change', function(room) {
                self.updateRoom(_.extend(room.toJSON(), {
                    lastActive: moment(room.get('lastActive')).calendar()
                }));
            });
            //
            //  User events
            //
            room.users.bind('add', function(user, users) {
                var matches = users.where({
                    uid: user.get('uid'),
                    room: user.get('room')
                })
                if (matches.length == 1) {
                    self.addUser(user.toJSON());
                }
            });
            room.users.bind('remove', function(user, users) {
                var matches = users.where({
                    uid: user.get('uid'),
                    room: user.get('room')
                })
                if (matches.length < 1) {
                    self.removeUser(user.toJSON());
                }
            });
        });
        this.collection.bind('remove', function(room) {
            self.remove(room.id);
        });
        this.collection.bind('reset', function() {
            self.empty();
        });
        self.$list.masonry({
            itemSelector: '.room'
        });
        // Masonry shims
        this.options.notifications.on('homeselected', function() {
            self.updateMasonry(true);
        });
    },
    add: function(room) {
        var item = Mustache.to_html(this.template, room);
        this.$list.prepend(item);
        this.updateMasonry();
    },
    remove: function(id) {
        this.$('.room[data-id=' + id + ']').remove();
        this.updateMasonry();
    },
    addUser: function(user) {
        var html = Mustache.to_html(this.userTemplate, user);
        this.$('.room[data-id=' + user.room + '] .users').prepend(html);
        this.updateMasonry();
    },
    removeUser: function(user) {
        this.$('.room[data-id=' + user.room + ']')
          .find('.user[data-uid=' + user.uid + ']').remove();
        this.updateMasonry();
    },
    updateRoom: function(room) {
        var $room = this.$('.room[data-id=' + room.id + ']');
        $room.find('.name').text(room.name);
        $room.find('.description').text(room.description);
        $room.find('.last-active .value').text(room.lastActive);
    },
    //
    // Sort rooms by users in dom
    //
    sortRooms: function() {
        this.$('.room').tsort('', {
            sortFunction: function(a, b){
                var aCount = a.e.find('.user').length;
                var bCount = b.e.find('.user').length;
                return aCount === bCount ? 0 : (aCount < bCount ? 1 : -1);
            }
        });
    },
    updateMasonry: function(sort) {
        // Only sort when invisible since its annoying
        if (sort) {
            this.sortRooms();
        }
        this.$list.masonry('reload');
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
        this.model.bind('add remove', function(users, users) {
            self.count(_.uniq(_.pluck(users.toJSON(), 'uid')).length);
        });
        this.model.bind('add', function(user, users) {
            var matches = users.where({
                uid: user.get('uid'),
                room: user.get('room')
            })
            if (matches.length == 1) {
                self.add(user.toJSON());
            }
        });
        this.model.bind('remove', function(user, users) {
            var matches = users.where({
                uid: user.get('uid'),
                room: user.get('room')
            })
            if (matches.length < 1) {
                self.remove(user.get('uid'));
            }
        });
        this.model.bind('change', function(user, users) {
            self.update(user.toJSON());
        });
        this.model.bind('reset', function() {
            self.empty();
        });
        //
        // User profile update
        //
        self.options.notifications.on('updateuser', function(profile) {
            var matches = self.model.where({
                uid: profile.id
            })
            _.each(matches, function(user) {
                user.set(profile);
            });
        });
    },
    count: function(count) {
        this.$el.closest('.item-list').find('.count').text(count);
    },
    add: function(user) {
        var html = Mustache.to_html(this.template, user);
        this.$el.append(html);
    },
    remove: function(id) {
        this.$('.user[data-uid=' + id + ']').remove();
    },
    update: function(user) {
        var $user = this.$('.user[data-uid=' + user.id + ']');
        $user.toggleClass('has-status', user.status && user.status.length > 0);
        $user.find('.status').text(user.status);
    },
    empty: function() {
        this.$el.empty();
    }
});

//
// Filelist
//
var FileListView = Backbone.View.extend({
    events: {
        'click .toggle-upload': 'toggleUpload'
    },
    initialize: function() {
        var self = this;
        this.notifications = this.options.notifications;
        this.room = this.options.room;
        this.template = $('#js-tmpl-file-item').html();
        //
        // Model Bindings
        //
        this.model.bind('add', function(file) {
            self.add(file.toJSON());
        });
        this.model.bind('remove', function(files) {
            self.remove(file.id);
        });
        this.model.bind('reset', function() {
            self.empty();
        });
    },
    render: function() {
        var self = this;
        var $input = this.$('.upload input[type="file"]');
        //
        // Uploads
        //
        $input.fileupload({
            dropZone: this.room.$('.file-drop-zone'),
            dataType: 'json',
            formData: {
                room: this.room.model.id
            }
        });
        $input.bind('fileuploadsubmit', function(e, data) {
            self.$('.throbber').show();
            data.formData = {
                room: self.room.model.id,
                paste: e.originalEvent.type == 'drop'
            };
        });
        $input.bind('fileuploaddone', function(e, data) {
            self.$('.throbber').hide();
            // Temporary solution to post images inside chat
            // We should make relative urls work for embeds
            if (data.result.url) {
                var url = location.protocol + '//' + location.host + data.result.url
                self.notifications.trigger('newmessage', {
                    room: self.room.model.id,
                    text: url
                });
            }
        });
    },
    add: function(file) {
        var html = Mustache.to_html(this.template, file);
        this.$('.file-list').prepend(html);
    },
    remove: function(id) {
        this.$('.file-list .file[data-id=' + id + ']').remove();
    },
    empty: function() {
        this.$('.file-list').empty();
    },
    toggleUpload: function(e) {
        e.preventDefault();
        this.$('.toggle-upload').toggleClass('open');
        this.$('.upload').toggle();
    }
});


//
// Room
//
var RoomView = Backbone.View.extend({
    className: 'view',
    events: {
        'keydown .entry textarea': 'keyCombo',
        'click .entry .send': 'sendMessage',
        'keypress .entry textarea': 'sendMessage',
        'submit .edit-room form': 'submitEditRoom',
        'click .delete-room': 'deleteRoom',
        'click .show-edit-room': 'showEditRoom',
        'click .hide-edit-room': 'hideEditRoom'
    },
    lastMessageUser: false,
    scrollLocked: true,
    knownUsers: {},
    initialize: function() {
        var self = this;
        //
        // Vars
        //
        this.template = $('#js-tmpl-room').html();
        this.messageTemplate = $('#js-tmpl-message').html();
        this.notifications = this.options.notifications;
        this.user = this.options.user;
        this.plugins = this.options.plugins;
        //
        // Subviews
        this.userlist = new UserListView({
            notifications: this.notifications,
            model: this.model.users
        });
        this.filelist = new FileListView({
            notifications: this.notifications,
            model: this.model.files,
            room: this
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
            var user = user.toJSON()
            self.knownUsers[user.uid] = {
                id: user.uid,
                key: user.safeName,
                name: user.safeName,
                avatar: user.avatar
            }
            self.$('.entry textarea').atwho({
                at: '@',
                tpl: '<li data-value="${key}"><img src="https://www.gravatar.com/avatar/${avatar}?s=20" height="20" width="20" /> ${name}</li>',
                data: _.toArray(self.knownUsers),
                limit: 4
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
        this.filelist.setElement(this.$('.files'));
        //
        // Render subviews
        //
        this.filelist.render();
        //
        // Message Scroll Lock
        //
        this.$messages.on('scroll', function() {
            self.updateScrollLock();
        });
        //
        // Emote Complete
        //
        this.notifications.on('emotes.update', function() {
            var emotes = _.map(self.plugins.emotes, function(url, id) {
                var name = id.replace(':', '');
                return {
                    id: name,
                    key: name,
                    name: name,
                    url: url
                };
            });
            self.$('.entry textarea').atwho({
                at: ':',
                tpl: '<li data-value="${key}"><img src="${url}" height="20" width="20" /> ${name}</li>',
                data: emotes,
                limit: 8
            });
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
        return window.utils.message.format(text, this.plugins);
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
    keyCombo: function(e) {
        var $textarea = this.$('.entry textarea');
        // ALT + ENTER
        // Add a newline
        if (e.altKey && e.keyCode === 13) {
            e.preventDefault();
            $textarea.val($textarea.val() + '\n');
        }
    },
    sendMessage: function(e) {
        if (e.type === 'keypress' && e.keyCode !== 13 || e.altKey) return;
        e.preventDefault();
        var $textarea = this.$('.entry textarea');
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
        this.$('.sidebar .room-name').text(name);
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
        $tabs.width(90 / $tabs.length + '%');
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
// Window Title and Message Count
//
var WindowTitleView = Backbone.View.extend({
    el: 'html',
    focus: true,
    count: 0,
    activeWebkitNotifications: [],
    activeWebkitNotificationMentions: [],
    initialize: function() {
        var self = this;
        this.config = this.options.config;
        this.notifications = this.options.notifications;
        this.notifications.on('switchview', function(view) {
            if (view && view.name) {
                self.title = view.name + ' &middot; ' + self.config.title ;
            } else {
                self.title = self.config.title;
            }
            $('title').html(self.title);
        });
        $(window).bind('focus blur', function(e) {
            if (e.type === 'focus') {
                self.count = 0;
                self.focus = true;
                $('title').html(self.title);
                // Clean up lingering notifications
                self.clean();
            } else {
                self.focus = false;
            }
        });
        this.notifications.on('addmessage', function(message) {
            // Nothing to do here if focused
            if (self.focus) return;
            //
            // Update Window Title
            //
            $('title').html('(' + parseInt(++self.count) + ') ' + self.title);
            //
            // Desktop Notifications because fuckyes webkit~!
            //
            if (window.webkitNotifications) {
               var notification = webkitNotifications.createNotification(
                  'https://www.gravatar.com/avatar/' + message.avatar + '?s=50',
                  message.name + ' in ' + message.roomName,
                  message.text
                );
                // If it's a mention, just show keep it sticky
                if (message.text.match(new RegExp('\\@' + self.options.user.get('safeName') + '\\b', 'i'))) {
                    self.activeWebkitNotificationMentions.push(notification);
                    notification.show();
                    return;
                }
                // Clear excessive notifications
                if (self.activeWebkitNotifications.length > 2) {
                    self.activeWebkitNotifications[0].cancel();
                    self.activeWebkitNotifications.shift();
                }
                self.activeWebkitNotifications.push(notification);
                notification.show();
                // Close after a few seconds
                setTimeout(function() {
                    notification.close();
                }, 4000);
            }
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
    },
    clean: function() {
        // Clean up webkit notifications
        if (window.webkitNotifications) {
            _.each(this.activeWebkitNotifications.concat(this.activeWebkitNotificationMentions), function(notification) {
                notification.cancel();
            });
        }
        // Clean up Fluid.app dock badge
        if (window.fluid !== undefined) {
            window.fluid.dockBadge = undefined;
        }
    }
});

var ExperimentalFeaturesView = Backbone.View.extend({
    el: '#experimental-features',
    focus: true,
    count: 0,
    events: {
        'click [name=desktop-notifications]': 'toggleDesktopNotifications'
    },
    initialize: function() {
        this.render();
    },
    render: function() {
        var $input = this.$('[name=desktop-notifications]');
        $input.find('.disabled').show()
          .siblings().hide();
        if (!window.webkitNotifications) {
            $input.attr('disabled', true);
            // Welp we're done here
            return;
        }
        if (window.webkitNotifications.checkPermission() === 0) {
            $input.find('.enabled').show()
              .siblings().hide();
        }
        if (window.webkitNotifications.checkPermission() === 2) {
            $input.find('.blocked').show()
              .siblings().hide();
        }
    },
    toggleDesktopNotifications: function() {
        var self = this;
        if (!window.webkitNotifications) {
            return;
        }
        window.webkitNotifications.requestPermission(function() {
            self.render();
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
        this.config = this.options.config;
        this.user = this.options.user;
        this.availableRooms = this.options.availableRooms;
        this.rooms = this.options.rooms;
        this.notifications = this.options.notifications;
        this.plugins = this.options.plugins;
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
        this.windowTitle = new WindowTitleView({
            config: this.config,
            notifications: this.notifications,
            user: this.user
        });
        this.experimentalFeatures = new ExperimentalFeaturesView();
        //
        // Connection Events
        //
        this.notifications.on('connect', function() {
            self.$('.connection-status')
                .removeClass('disconnected')
                .addClass('connected')
                .html('<i class="icon-signal"></i>  connected');
        });
        this.notifications.on('disconnect', function() {
            self.$('.connection-status')
              .removeClass('connected')
              .addClass('disconnected')
              .html('<i class="icon-warning-sign"></i> disconnected');
        });
        //
        // Room events
        //
        this.rooms.bind('add', function(room) {
            self.tabs.add(new RoomView({
                notifications: self.notifications,
                user: self.user,
                model: room,
                plugins: self.plugins
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
        var room = this.rooms.get(id);
        this.notifications.trigger('switchview', room ? room.toJSON() : false || {
            name: 'Rooms'
        });
    }
});
