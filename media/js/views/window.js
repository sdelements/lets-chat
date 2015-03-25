/*
 * WINDOW VIEW
 * TODO: Break it up :/
 */

'use strict';

+function(window, $, _, notify) {

    window.LCB = window.LCB || {};

    window.LCB.WindowView = Backbone.View.extend({
        el: 'html',
        keys: {
            'up+shift+alt down+shift+alt': 'nextRoom',
            's+shift+alt': 'toggleRoomSidebar',
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
        }
    });

    window.LCB.DesktopNotificationsView = Backbone.View.extend({
        count: 0,
        mentions: 0,
        focus: true,
        openNotifications: [],
        openMentions: [],
        initialize: function(options) {
            this.client = options.client;
            this.rooms = options.rooms;
            $(window).on('focus blur', _.bind(this.onFocusBlur, this));
            this.rooms.on('messages:new', this.onNewMessage, this);
        },
        onFocusBlur: function(e) {
            this.focus = (e.type === 'focus');
            _.each(_.merge(this.openNotifications, this.openMentions), function(notification) {
                notification.close && notification.close();
            });
        },
        onNewMessage: function(message) {
            if (this.focus || message.historical) {
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
                autoClose: 1000,
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
                notification.close();
            }, 1 * 4000);

        }
    });

}(window, $, _, notify);
