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
            'keyup .lcb-rooms-browser-filter-input': 'filter',
            'change .lcb-rooms-switch': 'toggle',
            'click .lcb-rooms-switch-label': 'toggle'
        },
        initialize: function(options) {
            this.client = options.client;
            this.template = Handlebars.compile($('#template-room-browser-item').html());
            this.userTemplate = Handlebars.compile($('#template-room-browser-item-user').html());
            this.rooms = options.rooms;
            this.rooms.on('add', this.add, this);
            this.rooms.on('remove', this.remove, this);
            this.rooms.on('change:name change:description', this.update, this);
            this.rooms.on('change:joined', this.updateToggles, this);
            this.rooms.on('users:add', this.addUser, this);
            this.rooms.on('users:remove', this.removeUser, this);
            this.rooms.on('add remove',  _.debounce(this.sort, 100), this);
            this.rooms.current.on('change:id', function(current, id) {
                // We only care about the list pane
                if (id !== 'list') return;
                this.sort();
            }, this);
        },
        updateToggles: function(room, joined) {
            this.$('.lcb-rooms-switch[data-id=' + room.id + ']').prop('checked', joined);
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
            (!$input.is(':checked') && this.client.joinRoom(room.id)) ||
                (this.rooms.get(room.id).get('joined') && this.client.leaveRoom(room.id));
        },
        add: function(room) {
            this.$('.lcb-rooms-list').append(this.template(room.toJSON()));
        },
        remove: function(room) {
            this.$('.lcb-rooms-list-item[data-id=' + room.id + ']').remove();
        },
        update: function(room) {
            this.$('.lcb-rooms-list-item[data-id=' + room.id + '] .lcb-rooms-list-item-name').text(room.get('name'));
            this.$('.lcb-rooms-list-item[data-id=' + room.id + '] .lcb-rooms-list-item-description').text(room.get('description'));
        },
        sort: function() {
            var that = this,
                $items = this.$('.lcb-rooms-list-item');
            $items.sort(function(a, b){
                var an = that.rooms.get($(a).data('id')).users.length,
                    bn = that.rooms.get($(b).data('id')).users.length;
                if (an > bn) return -1;
                if (an < bn) return 1;
                return 0;
            });
            $items.detach().appendTo(this.$('.lcb-rooms-list'));
        },
        filter: function(e) {
            e.preventDefault();
            var $input = $(e.currentTarget),
                needle = $input.val().toLowerCase();
            this.$('.lcb-rooms-list-item').each(function () {
                var haystack = $(this).find('.lcb-rooms-list-item-name').text().toLowerCase();
                $(this).toggle(haystack.indexOf(needle) >= 0);
            });
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
        },
        addUser: function(user, room) {
            this.$('.lcb-rooms-list-item[data-id="' + room.id + '"]')
                .find('.lcb-rooms-list-users').prepend(this.userTemplate(user.toJSON()));
        },
        removeUser: function(user, room) {
            this.$('.lcb-rooms-list-item[data-id="' + room.id + '"]')
                .find('.lcb-rooms-list-user[data-id="' + user.id + '"]').remove();
        }
    });

}(window, $, _);