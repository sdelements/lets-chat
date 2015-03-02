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

}(window, $, _);
