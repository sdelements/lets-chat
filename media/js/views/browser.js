/*
 * BROWSER VIEW
 * This is the "All Rooms" browser!
 */

'use strict';

+function(window, $, _) {

    window.LCB = window.LCB || {};

    window.LCB.BrowserView = Backbone.View.extend({
        events: {
            'submit .lcb-rooms-add': 'create',
            'change .lcb-rooms-switch': 'toggle',
            'click .lcb-rooms-switch-label': 'toggle'
        },
        initialize: function(options) {
            this.client = options.client;
            this.template = Handlebars.compile($('#template-room-browser-item').html());
            this.rooms = options.rooms;
            this.rooms.on('add', this.add, this);
            this.rooms.on('remove', this.remove, this);
            this.rooms.on('change:name change:description', this.update, this);
            this.rooms.on('change:joined', this.updateToggles, this);
        },
        updateToggles: function(room, joined) {
            this.$el.find('.lcb-rooms-switch[data-id=' + room.id + ']').prop('checked', joined);
        },
        toggle: function(e) {
            e.preventDefault();
            var $target = $(e.currentTarget),
                $input = $target.is(':checkbox') && $target || $target.siblings('[type="checkbox"]'),
                id = $input.data('id'),
                room = this.rooms.get(id);
            if (!room) {
                return;
            }
            !$input.is(':checked') && this.client.joinRoom(room.id) || this.client.leaveRoom(room.id);
        },
        add: function(room) {
            this.$el.find('.lcb-rooms-list').append(this.template(room.toJSON()));
        },
        remove: function(room) {
            this.$el.find('.lcb-rooms-list-item[data-id=' + room.id + ']').remove();
        },
        update: function(room) {
            this.$el.find('.lcb-rooms-list-item[data-id=' + room.id + '] .lcb-rooms-list-item-name').text(room.get('name'));
            this.$el.find('.lcb-rooms-list-item[data-id=' + room.id + '] .lcb-rooms-list-item-description').text(room.get('description'));
        },
        create: function(e) {
            e.preventDefault();
            var $modal = this.$('#lcb-add-room'),
                $form = this.$(e.target),
                data = {
                    name: this.$('.lcb-room-name').val().trim(),
                    slug: this.$('.lcb-room-slug').val().trim(),
                    description: this.$('.lcb-room-description').val(),
                    callback: function success() {
                        $modal.modal('hide');
                        $form.trigger('reset');
                    }
                };
            // we require name is non-empty
            if (!data.name) {
                $name.parent().addClass('has-error');
                return;
            }
            // we require slug is non-empty
            if (!data.slug) {
                $slug.parent().addClass('has-error');
                return;
            }
            this.client.events.trigger('rooms:create', data);
        }
    });

}(window, $, _);