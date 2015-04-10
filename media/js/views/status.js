/*
 * STATUS VIEW
 * Shows the user connected/disconnected
 */

'use strict';

+function(window, $, _) {

    window.LCB = window.LCB || {};

    window.LCB.StatusView = Marionette.ItemView.extend({

        attributes: {
            'class': 'lcb-status-inner'
        },

        template: Handlebars.compile($('#template-status').html()),

        onRender: function () {
            this.options.client.status.on('change:connected',
                                          this.update, this);
        },

        update: function(status, connected) {
            this.$el.find('[data-status="connected"]').toggle(connected);
            this.$el.find('[data-status="disconnected"]').toggle(!connected);
        }
    });

}(window, $, _);
