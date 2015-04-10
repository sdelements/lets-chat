/*
 * BROWSER VIEW
 * This is the "All Rooms" browser!
 */

'use strict';

+function(window, $, _) {

    window.LCB = window.LCB || {};

    var BrowserItemUser = Marionette.ItemView.extend({
        tagName: 'li',
        template: Handlebars.compile($('#template-room-browser-item-user').html()),
        attributes: function() {
            return {
                'class': 'lcb-rooms-list-user',
                'data-id': this.model.get('id'),
                'title': this.model.get('displayName')
            };
        }
    });

    var BrowserItem = Marionette.CompositeView.extend({
        tagName: 'li',
        template: Handlebars.compile($('#template-room-browser-item').html()),
        attributes: function() {
            return {
                'class': 'lcb-rooms-list-item',
                'data-id': this.model.get('id')
            };
        },

        events: {
            'change .lcb-rooms-switch': 'toggle',
            'click .lcb-rooms-switch-label': 'toggle'
        },

        childView: BrowserItemUser,
        childViewContainer: 'ul',
        onRender: function() {
            this.update();
            this.model.on('change', this.update, this);
        },
        update: function() {
            var room = this.model;
            this.$('.lcb-rooms-list-item-name')
                .text(room.get('name'));
            this.$('.lcb-rooms-list-item-description')
                .text(room.get('description'));
            this.$('.lcb-rooms-list-item-last-active .value')
                .text(moment(room.get('lastActive')).calendar());
            this.$('.lcb-rooms-switch').prop('checked', room.get('joined'));
        },
        toggle: function(e) {
            e.preventDefault();

            if (this.model.get('joined')) {
                window.client.leaveRoom(this.model.id);
            } else {
                window.client.joinRoom(this.model);
            }
        }
    });

    window.LCB.BrowserView = Marionette.CompositeView.extend({
        tagName: 'div',
        template: Handlebars.compile($('#template-room-browser').html()),

        attributes: function() {
            return {
                'class': 'lcb-rooms-browser lcb-pane',
                'data-id': 'list'
            };
        },

        events: {
            'submit .lcb-rooms-add': 'create',
            'keyup .lcb-rooms-browser-filter-input': 'search'
        },

        ui: {
            filter: '.lcb-rooms-browser-filter-input'
        },

        childView: BrowserItem,
        childViewContainer: 'ul',

        childViewOptions: function(model, index) {
            return {
                model: model,
                collection: model.users
            };
        },

        initialize: function(options) {
            options.tab.on('change:selected', function(current, selected) {
                if (selected) {
                    this.$el.show();
                } else {
                    this.$el.hide();
                }
            }, this);
        },

        search: function(e) {
            e.preventDefault();
            this._renderChildren();
        },

        addChild: function (item, ItemView, index) {
            var val = this.ui.filter.val(); // ????

            if (val) {
                var needle = val.toLowerCase();
                var haystack = item.get('name').toLowerCase();

                if (haystack.indexOf(needle) === -1) {
                    return;
                }
            }

            Marionette.CollectionView.prototype.addChild.apply(this, arguments);
        },

        create: function(e) {
            var that = this;
            e.preventDefault();
            var $form = this.$(e.target),
                $modal = this.$('#lcb-add-room'),
                $name = this.$('.lcb-room-name'),
                $slug = this.$('.lcb-room-slug'),
                $description = this.$('.lcb-room-description'),
                $password = this.$('.lcb-room-password'),
                $confirmPassword = this.$('.lcb-room-confirm-password'),
                data = {
                    name: $name.val().trim(),
                    slug: $slug.val().trim(),
                    description: $description.val(),
                    password: $password.val(),
                    callback: function success() {
                        $modal.modal('hide');
                        $form.trigger('reset');
                    }
                };

            $name.parent().removeClass('has-error');
            $slug.parent().removeClass('has-error');
            $confirmPassword.parent().removeClass('has-error');

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
                if (data.password !== $confirmPassword.val()) {
                    $confirmPassword.parent().addClass('has-error');
                    return;
                }

                swal({
                    title: 'Password-protected room',
                    text: 'You\'re creating a room with a shared password.\n' +
                          'Anyone who obtains the password may enter the room.',
                    showCancelButton: true
                }, function(){
                    that.client.events.trigger('rooms:create', data);
                });
                return;
            }

            this.client.events.trigger('rooms:create', data);
        }
    });

}(window, $, _);
