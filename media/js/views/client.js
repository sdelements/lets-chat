/*
 * CLIENT VIEW
 * The king of all views.
 */

'use strict';

+function(window, $, _) {

    window.LCB = window.LCB || {};

    window.LCB.ClientView = Backbone.View.extend({
        el: '#lcb-client',
        initialize: function(options) {
            this.client = options.client;
            //
            // Subviews
            //
            this.browser = new window.LCB.BrowserView({
                el: this.$el.find('.lcb-rooms-browser'),
                rooms: this.client.rooms,
                client: this.client
            });
            this.tabs = new window.LCB.TabsView({
                el: this.$el.find('.lcb-tabs'),
                rooms: this.client.rooms,
                client: this.client
            });
            this.panes = new window.LCB.PanesView({
                el: this.$el.find('.lcb-panes'),
                rooms: this.client.rooms,
                client: this.client
            });
            this.window = new window.LCB.WindowView({
                rooms: this.client.rooms,
                client: this.client
            });
            this.status = new window.LCB.StatusView({
                el: this.$el.find('.lcb-status-indicators'),
                client: this.client
            });
            this.accountButton = new window.LCB.AccountButtonView({
                el: this.$el.find('.lcb-account-button'),
                model: this.client.user
            });
            this.notifications = new window.LCB.NotificationsView();
            //
            // Modals
            //
            this.profileModal = new window.LCB.ProfileModalView({
                el: this.$el.find('#lcb-profile'),
                model: this.client.user
            });
            this.accountModal = new window.LCB.AccountModalView({
                el: this.$el.find('#lcb-account')
            });
            //
            // Misc
            //
            this.client.status.once('change:connected', _.bind(function(status, connected) {
                this.$el.find('.lcb-client-loading').hide(connected);
            }, this));
            return this;
        }
    });

    window.LCB.AccountButtonView = Backbone.View.extend({
        initialize: function() {
            this.model.on('change', this.update, this);
        },
        update: function(user){
            this.$('.lcb-account-button-name').text(user.get('displayName'));
        }
    });


}(window, $, _);