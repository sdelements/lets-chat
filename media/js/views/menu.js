/*
 * CLIENT VIEW
 * The king of all views.
 */

'use strict';

+function(window, $, _) {

    window.LCB = window.LCB || {};

    window.LCB.MenuView = Marionette.ItemView.extend({
        tagName: 'div',

        attributes: {
            'class': 'lcb-menu-inner'
        },

        template: '#template-menu',

        onRender: function() {
            this.model.on('change', this.update, this);
        },

        update: function(user){
            this.$('.lcb-account-button-username')
                .text('@' + user.get('username'));
            this.$('.lcb-account-button-name')
                .text(user.get('displayName'));
        }
    });


}(window, $, _);
