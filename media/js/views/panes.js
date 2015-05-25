/*
 * TABS/PANES VIEW
 */

'use strict';

+function(window, $, _) {

    window.LCB = window.LCB || {};

    window.LCB.TabsView = Backbone.View.extend({
        events: {
            'click .lcb-tab-close': 'leave'
        },
        focus: true,
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
            // Blur/Focus events
            $(window).on('focus blur', _.bind(this.onFocusBlur, this));
            this.render();
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
            var $tab = this.$('.lcb-tab[data-id=' + message.room.id + ']'),
                $total = $tab.find('.lcb-tab-alerts-total'),
                $mentions = $tab.find('.lcb-tab-alerts-mentions');
            if (message.historical || $tab.length === 0
                    || ((this.rooms.current.get('id') === message.room.id) && this.focus)) {
                // Nothing to do here!
                return;
            }
            var total = parseInt($tab.data('count-total')) || 0,
                mentions = parseInt($tab.data('count-mentions')) || 0;
            // All messages
            $tab.data('count-total', ++total);
            $total.text(total);
            // Just mentions
            if (new RegExp('\\B@(' + this.client.user.get('username') + ')(?!@)\\b', 'i').test(message.text)) {
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
        },
        onFocusBlur: function(e) {
            var that = this;
            this.focus = (e.type === 'focus');
            clearTimeout(this.clearTimer);
            if (this.focus) {
                this.clearTimer = setTimeout(function() {
                    that.clearAlerts(that.rooms.current.get('id'));
                }, 1000);
                return;
            }
            that.clearAlerts(that.rooms.current.get('id'));
        }
    });

    window.LCB.PanesView = Backbone.View.extend({
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
            $pane.removeClass('hide').siblings().addClass('hide');
            $(window).width() > 767 && $pane.find('[autofocus]').focus();
            this.views[id] && this.views[id].scrollMessages(true);
        },
        add: function(room) {
            if (this.views[room.id]) {
                // Nothing to do, this room is already here
                return;
            }
            this.views[room.id] = new window.LCB.RoomView({
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

}(window, $, _);
