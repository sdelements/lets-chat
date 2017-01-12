/*
 * STATUS VIEW
 * Shows the user connected/disconnected
 */

'use strict';

+function(window, $, _) {

    window.LCB = window.LCB || {};

    window.LCB.StatusView = Backbone.View.extend({
        initialize: function(options) {
            var that = this;
            this.client = options.client;
            this.client.status.on('change:connected', function(status, connected) {
                that.$el.find('[data-status="connected"]').toggle(connected);
                that.$el.find('[data-status="disconnected"]').toggle(!connected);
            });
        }
    });

}(window, $, _);