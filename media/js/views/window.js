/*
 * WINDOW VIEW
 * TODO: Break it up :/
 */

'use strict';

+function(window, $, _) {

    window.LCB = window.LCB || {};

    window.LCB.WindowView = Backbone.View.extend({
        el: 'html',
        keys: {
            'up+shift+alt down+shift+alt': 'nextRoom',
            'space+shift+alt': 'recallRoom',
            'left+shift+alt right+shift+alt': 'toggleRoomSidebar'
        },
        initialize: function(options) {
            this.client = options.client;
            this.rooms = options.rooms;
            this.originalTitle = this.$('title').text();
            this.title = this.originalTitle;
            this.focus = true;
            this.count = 0;
            this.mentions = 0;
            this.activeDesktopNotifications = [];
            this.activeDesktopNotificationMentions = [];

            $(window).on('focus blur', _.bind(this.focusBlur, this));

            this.rooms.current.on('change:id', function(current, id) {
                var room = this.rooms.get(id);
                var title = room ? room.get('name') : 'Rooms';
                this.updateTitle(title);
            }, this);

            this.rooms.on('change:name', function(room) {
                if (room.id !== this.rooms.current.get('id')) {
                    return;
                }
                this.updateTitle(room.get('name'));
            }, this);

            this.rooms.on('messages:new', this.onNewMessage, this);
        },
        updateTitle: function(name) {
            if (name) {
                this.title = $('<pre />').text(name).html() +
                ' &middot; ' + this.originalTitle;
            } else {
                this.title = this.originalTitle;
            }
            this.$('title').html(this.title);
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
            var view = this.client.view.panes.views[this.rooms.current.get('id')];
            view && view.toggleSidebar && view.toggleSidebar();
        },
        focusBlur: function(e) {
            this.focus = e.type === 'focus';

            if (this.focus) {
                clearInterval(this.titleTimer);
                this.count = 0;
                this.mentions = 0;
                this.focus = true;
                this.$('title').html(this.title);
                this.titleTimer = false;
                this.titleTimerFlip = false;
            }
        },
        onNewMessage: function(message) {
            this.countMessage(message);
            this.flashTitle(message);
            this.createDesktopNotification(message);
        },
        countMessage: function(message) {
            if (this.focus || message.historical) {
                return;
            }

            ++this.count;

            var username = this.client.user.get('username');
            var regex = new RegExp('\\B@(' + username + ')(?!@)\\b', 'i');
            if (regex.test(message.text)) {
                ++this.mentions;
            }
        },
        flashTitle: function(message) {
            if (this.focus || message.historical) {
                return;
            }

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
        createDesktopNotification: function(message) {
            if (this.focus || message.historical) {
                return;
            }

            if (!notify.isSupported ||
                notify.permissionLevel() != notify.PERMISSION_GRANTED) {
                return;
            }

            var self = this;
            var roomId = message.room.id;

            var avatar = message.owner.avatar;
            var icon = 'https://www.gravatar.com/avatar/' + avatar + '?s=50';
            var title = message.owner.username + ' in ' + message.room.name;
            var mention = message.mentioned;

            var notification = notify.createNotification(title, {
                body: message.text,
                icon: icon,
                tag: message.id,
                onclick: function() {
                    window.focus();
                    self.client.events.trigger('rooms:switch', roomId);
                }
            });

            // If it's a mention, keep it sticky
            if (mention) {
                this.activeDesktopNotificationMentions.push(notification);
                return;
            }

            // Clear excessive notifications
            if (this.activeDesktopNotifications.length > 2) {
                this.activeDesktopNotifications[0].close();
                this.activeDesktopNotifications.shift();
            }
            this.activeDesktopNotifications.push(notification);

            // Close after a few seconds
            setTimeout(function() {
                notification.close();
            }, 5 * 1000);
        }
    });

}(window, $, _);