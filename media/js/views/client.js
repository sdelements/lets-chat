/*
 * CLIENT VIEW
 * The king of all views.
 */

'use strict';

+function(window, $, _) {

    window.LCB = window.LCB || {};

    window.LCB.ClientView = Marionette.LayoutView.extend({

        attributes: {
            'id': 'lcb-client',
            'class': 'lcb-client'
        },

        template: '#template-chat',

        events: {
            // 'click .lcb-tab': 'toggleSideBar',
            'click .lcb-header-toggle': 'toggleSideBar'
        },

        regions: {
            status: '.lcb-status-indicators',
            menu: '.lcb-menu',
            tabs: '.lcb-tabs',
            panes: '.lcb-panes',
        },

        onRender: function() {
            this.options.client.status.once('change:connected',
                                            this.hideLoadingIndicator, this);

            this.getRegion('status').show(new window.LCB.StatusView({
                client: this.options.client
            }));

            this.getRegion('menu').show(new window.LCB.MenuView({
                model: this.options.client.user,
                client: this.options.client
            }));

            this.getRegion('tabs').show(new window.LCB.TabsView({
                collection: this.options.client.tabs,
                client: this.options.client
            }));

            this.getRegion('panes').show(new window.LCB.PanesView({
                collection: this.options.client.tabs,
                client: this.options.client
            }));

            this.hotKeys = new window.LCB.HotKeysView({
                rooms: this.options.client.rooms,
                client: this.options.client
            });
        },

        hideLoadingIndicator: function(status, connected) {
            this.$el.find('.lcb-client-loading').hide(connected);
        },

        toggleSideBar: function(e) {
            this.$el.toggleClass('lcb-sidebar-opened');
        }
    });


}(window, $, _);
