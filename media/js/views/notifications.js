/*
 * NOTIFICATIONS VIEW
 * Currently responsible for the desktop notification modal...
 */

'use strict';

+function(window, $, notify) {

    window.LCB = window.LCB || {};

    window.LCB.NotificationsView = Backbone.View.extend({
        el: '#lcb-notifications',
        focus: true,
        count: 0,
        events: {
            'click [name=desktop-notifications]': 'toggleDesktopNotifications'
        },
        initialize: function() {
            this.render();
        },
        render: function() {
            var $input = this.$('[name=desktop-notifications]');
            $input.find('.disabled').show()
              .siblings().hide();
            if (!notify.isSupported) {
                $input.attr('disabled', true);
                // Welp we're done here
                return;
            }
            if (notify.permissionLevel() === notify.PERMISSION_GRANTED) {
                $input.find('.enabled').show()
                  .siblings().hide();
            }
            if (notify.permissionLevel() === notify.PERMISSION_DENIED) {
                $input.find('.blocked').show()
                  .siblings().hide();
            }
        },
        toggleDesktopNotifications: function() {
            var self = this;
            if (!notify.isSupported) {
                return;
            }
            notify.requestPermission(function() {
                self.render();
            });
        }
    });

}(window, $, notify);