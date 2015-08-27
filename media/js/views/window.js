/*
 * WINDOW VIEW
 * TODO: Break it up :/
 */

'use strict';

+function(window, $, _, notify) {

    window.LCB = window.LCB || {};

    window.LCB.WindowView = Backbone.View.extend({
        el: 'html',
        focus: true,
        count: 0,
        mentions: 0,
        countFavicon: new Favico({
            position: 'down',
            animation: 'none',
            bgColor: '#b94a48'
        }),
        mentionsFavicon: new Favico({
            position: 'left',
            animation: 'none',
            bgColor: '#f22472'
        }),
        initialize: function(options) {

            var that = this;

            this.client = options.client;
            this.rooms = options.rooms;
            this.originalTitle = document.title;
            this.title = this.originalTitle;

            $(window).on('focus blur', _.bind(this.onFocusBlur, this));

            this.rooms.current.on('change:id', function(current, id) {
                var room = this.rooms.get(id),
                    title = room ? room.get('name') : 'Rooms';
                this.updateTitle(title);
            }, this);

            this.rooms.on('change:name', function(room) {
                if (room.id !== this.rooms.current.get('id')) {
                    return;
                }
                this.updateTitle(room.get('name'));
            }, this);

            this.rooms.on('messages:new', this.onNewMessage, this);

            // Last man standing
            _.defer(function() {
                that.updateTitle();
            });

        },
        onFocusBlur: function(e) {
            this.focus = (e.type === 'focus');
            if (this.focus) {
                clearInterval(this.titleTimer);
                clearInterval(this.faviconBadgeTimer);
                this.count = 0;
                this.mentions = 0;
                this.titleTimer = false;
                this.titleTimerFlip = false;
                this.faviconBadgeTimer = false;
                this.faviconBadgeTimerFlip = false;
                this.updateTitle();
                this.mentionsFavicon.reset();
            }
        },
        onNewMessage: function(message) {
            if (this.focus || message.historical || message.owner.id === this.client.user.id) {
                return;
            }
            this.countMessage(message);
            this.flashTitle()
            this.flashFaviconBadge();
        },
        countMessage: function(message) {
            ++this.count;
            message.mentioned && ++this.mentions;
        },
        flashTitle: function() {
            var titlePrefix = '';
            if (this.count > 0) {
                titlePrefix += '(' + parseInt(this.count);
                if (this.mentions > 0) {
                    titlePrefix += '/' + parseInt(this.mentions) + '@';
                }
                titlePrefix += ') ';
            }
            document.title = titlePrefix + this.title;
        },
        flashFaviconBadge: function() {
            if (!this.faviconBadgeTimer) {
                this._flashFaviconBadge();
                var flashFaviconBadge = _.bind(this._flashFaviconBadge, this);
                this.faviconBadgeTimer = setInterval(flashFaviconBadge, 1 * 2000);
            }
        },
        _flashFaviconBadge: function() {
            if (this.mentions > 0 && this.faviconBadgeTimerFlip) {
                this.mentionsFavicon.badge(this.mentions);
            } else {
                this.countFavicon.badge(this.count);
            }
            this.faviconBadgeTimerFlip = !this.faviconBadgeTimerFlip;
        },
        updateTitle: function(name) {
            if (!name) {
                var room = this.rooms.get(this.rooms.current.get('id'));
                name = (room && room.get('name')) || 'Rooms';
            }
            if (name) {
                this.title = name + ' \u00B7 ' + this.originalTitle;
            } else {
                this.title = this.originalTitle;
            }
            document.title = this.title;
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
            if (this.client.options.giphyEnabled) {
                e.preventDefault();
                $('.lcb-giphy').modal('show');
            }
        }
    });

    window.LCB.DesktopNotificationsView = Backbone.View.extend({
        focus: true,
        openNotifications: [],
        openMentions: [],
        initialize: function(options) {
            notify.config({
                pageVisibility: false
            });
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
            if (this.focus || message.historical || message.owner.id === this.client.user.id) {
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

            var roomID = message.room.id,
                avatar = message.owner.avatar,
                icon = 'https://www.gravatar.com/avatar/' + avatar + '?s=50',
                title = message.owner.displayName + ' in ' + message.room.name,
                mention = message.mentioned;

            var notification = notify.createNotification(title, {
                body: message.text,
                icon: icon,
                tag: message.id,
                onclick: function() {
                    window.focus();
                    that.client.events.trigger('rooms:switch', roomID);
                }
            });

            //
            // Mentions
            //
            if (mention) {
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
                notification.close && notification.close();
            }, 3000);

        }
    });

}(window, $, _, notify);
