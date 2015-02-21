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
            this.rooms.on('change:description change:name', this.update, this);
            this.rooms.on('change:lastActive', _.debounce(this.updateLastActive, 200), this);
            this.rooms.on('change:joined', this.updateToggles, this);
            this.rooms.on('users:add', this.addUser, this);
            this.rooms.on('users:remove', this.removeUser, this);
            this.rooms.on('users:add users:remove add remove', this.sort, this);
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

            if (room.get('joined')) {
                this.client.leaveRoom(room.id);
            } else {
                this.client.joinRoom(room);
            }
        },
        add: function(room) {
            var room = room.toJSON ? room.toJSON() : room,
                context = _.extend(room, {
                    lastActive: moment(room.lastActive).calendar()
                });
            this.$('.lcb-rooms-list').append(this.template(context));
        },
        remove: function(room) {
            this.$('.lcb-rooms-list-item[data-id=' + room.id + ']').remove();
        },
        update: function(room) {
            this.$('.lcb-rooms-list-item[data-id=' + room.id + '] .lcb-rooms-list-item-name').text(room.get('name'));
            this.$('.lcb-rooms-list-item[data-id=' + room.id + '] .lcb-rooms-list-item-description').text(room.get('description'));
        },
        updateLastActive: function(room) {
            this.$('.lcb-rooms-list-item[data-id=' + room.id + '] .lcb-rooms-list-item-last-active .value').text(moment(room.get('lastActive')).calendar());
        },
        sort: function(model) {
            var that = this,
                $items = this.$('.lcb-rooms-list-item');
            // We only care about other users
            if (this.$el.hasClass('hide') && model && model.id === this.client.user.id)
                return;
            $items.sort(function(a, b){
                var ar = that.rooms.get($(a).data('id')),
                    br = that.rooms.get($(b).data('id')),
                    au = ar.users.length,
                    bu = br.users.length,
                    aj = ar.get('joined'),
                    bj = br.get('joined')
                if ((aj && bj) || (!aj && !bj)) {
                    if (au > bu) return -1;
                    if (au < bu) return 1;
                }
                if (aj) return -1;
                if (bj) return 1;
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
            var that = this;
            e.preventDefault();
            var $modal = this.$('#lcb-add-room'),
                $form = this.$(e.target),
                data = {
                    name: this.$('.lcb-room-name').val().trim(),
                    slug: this.$('.lcb-room-slug').val().trim(),
                    description: this.$('.lcb-room-description').val(),
                    password: this.$('.lcb-room-password').val(),
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
            // remind the user, that users may share the password with others
            if (data.password) {
                swal({
                    title: 'Are you sure?',
                    text: 'Users can share this password with other users (who were not invited by you).',
                    type: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Yes, I know it!'
                }, function(){
                    that.client.events.trigger('rooms:create', data);
                });
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
