/*
 * WINDOW VIEW
 * TODO: Break it up :/
 */

'use strict';

+function(window, $, _, notify) {

    window.LCB = window.LCB || {};

    window.LCB.RootView = Backbone.View.extend({
        el: 'html',

        focus: true,
        count: 0,
        mentions: 0,

        modals: {

        },

        initialize: function(options) {
            this.client = options.client;
            this.rooms = options.client.rooms;
            this.tabs = options.client.tabs;

            this.originalTitle = this.$('title').text();
            this.title = this.originalTitle;
            $(window).on('focus blur', _.bind(this.onFocusBlur, this));

            var view = new options.childView({
                client: options.client,
                el: this.$el.find('#lcb-client')
            });

            view.render();

            this.initializeModals(options);

            this.notifications = new window.LCB.DesktopNotificationsView({
                rooms: options.client.rooms,
                client: options.client
            });

            this.rooms.on('messages:new', this.onNewMessage, this);

            this.tabs.on('change:selected', function(tab, selected) {
                if (!selected) {
                    return;
                }
                this.updateTitle(tab.get('name'));
            }, this);
        },

        initializeModals: function(options) {
            if (options.client.options.filesEnabled) {
                this.modals.upload = new window.LCB.UploadView({
                    el: this.$el.find('#lcb-upload'),
                    dropZone: this.$el.find('#lcb-client'),
                    client: options.client
                });
            }

            this.modals.profile = new window.LCB.ProfileModalView({
                el: this.$el.find('#lcb-profile'),
                model: options.client.user
            });
            this.modals.account = new window.LCB.AccountModalView({
                el: this.$el.find('#lcb-account'),
                model: options.client.user
            });
            this.modals.token = new window.LCB.AuthTokensModalView({
                el: this.$el.find('#lcb-tokens')
            });
            this.modals.notifications = new window.LCB.NotificationsModalView({
                el: this.$el.find('#lcb-notifications')
            });
            this.modals.giphy = new window.LCB.GiphyModalView({
                el: this.$el.find('#lcb-giphy')
            });
        },

        onFocusBlur: function(e) {
            this.focus = (e.type === 'focus');
            if (this.focus) {
                clearInterval(this.titleTimer);
                this.count = 0;
                this.mentions = 0;
                this.titleTimer = false;
                this.titleTimerFlip = false;
                this.updateTitle();
            }
        },

        onNewMessage: function(message) {
            if (this.focus || message.get('historical')) {
                return;
            }

            this.countMessage(message);
            this.flashTitle();
        },

        countMessage: function(message) {
            this.count++;
            if (message.get('mentioned')) {
                this.mentions++;
            }
        },

        flashTitle: function() {
            if (!this.titleTimer) {
                this._flashTitle();
                var flashTitle = _.bind(this._flashTitle, this);
                this.titleTimer = setInterval(flashTitle, 1 * 1000);
            }
        },

        _flashTitle: function() {
            var titlePrefix = '';
            if (this.count > 0) {
                titlePrefix += '(' + parseInt(this.count);
                if (this.mentions > 0) {
                    titlePrefix += '/' + parseInt(this.mentions) + '@';
                }
                titlePrefix += ') ';
            }
            var title = this.titleTimerFlip ? this.title : titlePrefix + this.title;
            this.$('title').html(title);
            this.titleTimerFlip = !this.titleTimerFlip;
        },

        updateTitle: function(name) {
            if (name) {
                this.title = $('<pre />').text(name).html() +
                ' &middot; ' + this.originalTitle;
            } else {
                this.title = this.originalTitle;
            }
            this.$('title').html(this.title);
        }
    });

    window.LCB.HotKeysView = Backbone.View.extend({
        el: 'html',
        keys: {
            'up+shift+alt down+shift+alt': 'nextRoom',
            's+shift+alt': 'toggleRoomSidebar',
            'g+shift+alt': 'openGiphyModal',
            'space+shift+alt': 'recallRoom'
        },
        initialize: function(options) {
            this.client = options.client;
            this.rooms = options.rooms;
        },
        nextRoom: function(e) {
            var method = e.keyCode === 40 ? 'next' : 'prev',
                selector = e.keyCode === 40 ? 'first' : 'last',
                $next = this.$('.lcb-tabs').find('[data-id].selected')[method]();
            if ($next.length === 0) {
                $next = this.$('.lcb-tabs').find('[data-id]:' + selector);
            }
            this.client.events.trigger('rooms:switch', $next.data('id'));
        },
        recallRoom: function() {
            this.client.events.trigger('rooms:switch', this.rooms.last.get('id'));
        },
        toggleRoomSidebar: function(e) {
            e.preventDefault();
            var view = this.client.view.panes.views[this.rooms.current.get('id')];
            view && view.toggleSidebar && view.toggleSidebar();
        },
        openGiphyModal: function(e) {
            e.preventDefault();
            $('.lcb-giphy').modal('show');
        }
    });

    window.LCB.DesktopNotificationsView = Backbone.View.extend({
        focus: true,
        openNotifications: [],
        openMentions: [],
        initialize: function(options) {
            this.client = options.client;
            this.rooms = options.rooms;
            $(window).on('focus blur unload', _.bind(this.onFocusBlur, this));
            this.rooms.on('messages:new', this.onNewMessage, this);
        },
        onFocusBlur: function(e) {
            this.focus = (e.type === 'focus');
            _.each(_.merge(this.openNotifications, this.openMentions), function(notification) {
                notification.close && notification.close();
            });
        },
        onNewMessage: function(message) {
            if (this.focus || message.get('historical')) {
                return;
            }
            this.createDesktopNotification(message);
        },
        createDesktopNotification: function(message) {

            var that = this;

            if (!notify.isSupported ||
                notify.permissionLevel() != notify.PERMISSION_GRANTED) {
                return;
            }

            var owner = message.get('owner'),
                room = message.get('room');

            var icon = 'https://www.gravatar.com/avatar/' + owner.avatar + '?s=50';

            var title = owner.displayName + ' in ' + room.name;

            var notification = notify.createNotification(title, {
                body: message.get('text'),
                icon: 'https://www.gravatar.com/avatar/' + owner.avatar + '?s=50',
                tag: message.id,
                autoClose: 1000,
                onclick: function() {
                    window.focus();
                    that.client.events.trigger('rooms:switch', room.id);
                }
            });
            //
            // Mentions
            //
            if (message.get('mentioned')) {
                if (this.openMentions.length > 2) {
                    this.openMentions[0].close();
                    this.openMentions.shift();
                }
                this.openMentions.push(notification);
                // Quit early!
                return;
            }
            //
            // Everything else
            //
            if (this.openNotifications.length > 2) {
                this.openNotifications[0].close();
                this.openNotifications.shift();
            }
            this.openNotifications.push(notification);

            setTimeout(function() {
                notification.close();
            }, 1 * 4000);

        }
    });

}(window, $, _, notify);
