/*
 * TABS/PANES VIEW
 */

'use strict';

+function(window, $, _) {

    window.LCB = window.LCB || {};

    var TabView = Marionette.ItemView.extend({
        tagName: 'li',

        template: function() { return ''; },

        attributes: function() {
            var opts = {
                'class': 'lcb-tab',
                'data-id': this.model.id,

            };

            if (this.model.get('selected')) {
                opts.class += ' selected';
            }

            return opts;
        },

        onRender: function() {
            this.model.on('change:selected', this.onSelect, this);
            this.options.childView.render();
            this.$el.append(this.options.childView.el);
        },

        onSelect: function(current, selected) {
            if (selected) {
                this.$el.addClass('selected');
            } else {
                this.$el.removeClass('selected');
            }
        }
    });

    var ListTabView = Marionette.ItemView.extend({
        tagName: 'a',

        attributes: function() {
            return {
                'href': '#!/'
            };
        },

        template: function() {
            return '<i class="fa fa-th"></i>';
        }
    });

    var RoomTabView = Marionette.ItemView.extend({
        tagName: 'a',

        attributes: function() {
            return {
                'href': '#!/room/' + this.model.id
            };
        },

        template: '#template-room-tab',

        events: {
            'click .lcb-tab-close': 'leave'
        },

        ui: {
            newMessages: '.lcb-tab-alerts-total',
            newMentions: '.lcb-tab-alerts-mentions'
        },

        onRender: function() {
            this.model.messages.on('add', this.alert, this);
            this.options.tab.on('change:selected', this.removeAlerts, this);
        },

        update: function() {
            this.$el.find('.lcb-tab-title').text(
                this.model.get('name')
            );
        },

        leave: function(e) {
            e.preventDefault();
            this.options.client.events
                .trigger('rooms:leave', this.model.get('id'));
        },

        alert: function(message) {
            if (message.get('historical') || this.options.tab.get('selected')) {
                return;
            }

            var $total = this.ui.newMessages;
            var total = parseInt($total.text() || '0') || 0;
            $total.text(++total);

            if (!message.get('mentioned')) {
                return;
            }

            var $mentions = this.ui.newMentions;
            var mentions = parseInt($mentions.text() || '0') ||  0;
            $mentions.text(++mentions);
        },

        removeAlerts: function(tab, selected) {
            if (selected) {
                this.$el.data('count-total', 0).data('count-mentions', 0);
                this.$el.find('.lcb-tab-alerts-total').text('');
                this.$el.find('.lcb-tab-alerts-mentions').text('');
            }
        }

    });

    window.LCB.TabsView = Marionette.CompositeView.extend({

        tagName: 'div',
        childViewContainer: 'ul',

        template: '#template-tabs',

        buildChildView: function(child, ChildViewClass, childViewOptions) {
            return new TabView({
                client: this.options.client,
                model: child,
                childView: new ChildViewClass(childViewOptions)
            });
        },

        getChildView: function(model) {
            if (model.get('type') === 'list') {
                return ListTabView;
            }
            return RoomTabView;
        },

        childViewOptions: function(model, index) {
            return {
                client: this.options.client,
                model: model.get('model'),
                tab: model
            };
        }
    });

    window.LCB.PanesView = Marionette.CollectionView.extend({

        attributes: {
            'class': 'lcb-panes-inner'
        },

        getChildView: function(model) {
            if (model.get('type') === 'list') {
                return window.LCB.BrowserView;
            }
            return window.LCB.RoomView;
        },

        childViewOptions: function(model, index) {
            var opts = {
                model: model.get('model'),
                tab: model,
                client: this.options.client
            };

            if (model.get('type') === 'list') {
                opts.collection = this.options.client.rooms;
            }

            return opts;
        }
    });

}(window, $, _);
