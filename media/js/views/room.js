/*
 * ROOM VIEW
 * TODO: Break it up :/
 */

'use strict';

+function(window, $, _) {

    window.LCB = window.LCB || {};

    window.LCB.RoomUsersView = Backbone.View.extend({
        initialize: function(options) {
            this.template = Handlebars.compile($('#template-user').html());
            this.collection.on('add remove', function() {
                this.count();
            }, this);
            this.collection.on('add', function(user) {
                this.add(user.toJSON());
            }, this);
            this.collection.on('change', function(user) {
                this.update(user.toJSON());
            }, this);
            this.collection.on('remove', function(user) {
                this.remove(user.id);
            }, this);
            this.render();
        },
        render: function() {
            this.collection.each(function(user) {
                this.add(user.toJSON());
            }, this);
            this.count();
        },
        add: function(user) {
            this.$('.lcb-room-sidebar-list').prepend(this.template(user));
        },
        remove: function(id) {
            this.$('.lcb-room-sidebar-user[data-id=' + id + ']').remove();
        },
        count: function(users) {
            this.$('.lcb-room-sidebar-users-count').text(this.collection.length);
        },
        update: function(user){
            this.$('.lcb-room-sidebar-user[data-id=' + user.id + ']')
                .replaceWith(this.template(user));
        }
    });

    window.LCB.RoomView = Backbone.View.extend({
        events: {
            'scroll .lcb-messages': 'updateScrollLock',
            'keypress .lcb-entry-input': 'sendMessage',
            'click .lcb-entry-button': 'sendMessage',
            'DOMCharacterDataModified .lcb-room-heading, .lcb-room-description': 'sendMeta',
            'click .lcb-room-toggle-sidebar': 'toggleSidebar',
            'click .show-edit-room': 'showEditRoom',
            'click .hide-edit-room': 'hideEditRoom',
            'click .submit-edit-room': 'submitEditRoom',
            'click .archive-room': 'archiveRoom',
            'click .lcb-room-poke': 'poke'
        },
        initialize: function(options) {
            this.client = options.client;
            this.template = options.template;
            this.messageTemplate = Handlebars.compile($('#template-message').html());
            this.render();
            this.model.on('messages:new', this.addMessage, this);
            this.model.on('change', this.updateMeta, this);
            this.model.on('remove', this.goodbye, this);
            //
            // Subviews
            //
            this.usersList = new window.LCB.RoomUsersView({
                el: this.$('.lcb-room-sidebar-users'),
                collection: this.model.users
            });
        },
        render: function() {
            this.$el = $(this.template(_.extend(this.model.toJSON(), {
                sidebar: store.get('sidebar')
            })));
            this.$messages = this.$('.lcb-messages');
            // Scroll Locking
            this.scrollLocked = true;
            this.$messages.on('scroll',  _.bind(this.updateScrollLock, this));
            this.atwhoMentions();
            this.atwhoAllMentions();
            this.atwhoRooms();
            this.atwhoEmotes();
        },
        getEmotes: function(cb) {
            if (!window.LCB.RoomView.emotes) {
                window.LCB.RoomView.emotes = $.get('/extras/emotes');
            }
            window.LCB.RoomView.emotes.success(cb);
        },
        getUsers: function(cb) {
            if (!window.LCB.RoomView.users) {
                window.LCB.RoomView.users = $.get('/users');
            }
            window.LCB.RoomView.users.success(cb);
        },
        atwhoTplEval: function(tpl, map) {
            var error;
            try {
                return tpl.replace(/\$\{([^\}]*)\}/g, function(tag, key, pos) {
                    return (map[key] || '')
                        .replace(/&/g, '&amp;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&apos;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
                });
            } catch (_error) {
                error = _error;
                return "";
            }
        },
        atwhoMentions: function () {
            var users = this.model.users;

            function filter(query, data, searchKey) {
                var q = query.toLowerCase();
                var results = users.filter(function(user) {
                    var attr = user.attributes;

                    if (!attr.safeName) {
                        attr.safeName = attr.displayName.replace(/\W/g, '');
                    }

                    var val1 = attr.username.toLowerCase();
                    var val1i = val1.indexOf(q);
                    if (val1i > -1) {
                        attr.atwho_order = val1i;
                        return true;
                    }

                    var val2 = attr.safeName.toLowerCase();
                    var val2i = val2.indexOf(q);
                    if (val2i > -1) {
                        attr.atwho_order = val2i + attr.username.length;
                        return true;
                    }

                    return false;
                });

                return results.map(function(user) {
                    return user.attributes;
                });
            }

            function sorter(query, items, search_key) {
                return items.sort(function(a, b) {
                    return a.atwho_order - b.atwho_order;
                });
            }

            this.$('.lcb-entry-input')
            .atwho({
                at: '@',
                tpl: '<li data-value="@${username}"><img src="https://www.gravatar.com/avatar/${avatar}?s=20" height="20" width="20" /> @${username} <small>${displayName}</small></li>',
                callbacks: {
                    filter: filter,
                    sorter: sorter,
                    tpl_eval: this.atwhoTplEval
                }
            });
        },
        atwhoAllMentions: function () {
            function filter(query, data, searchKey) {
                var q = query.toLowerCase();
                var results = _.filter(data, function(user) {

                    if (!user.safeName) {
                        user.safeName = user.displayName.replace(/\W/g, '');
                    }

                    var val1 = user.username.toLowerCase();
                    var val1i = val1.indexOf(q);
                    if (val1i > -1) {
                        user.atwho_order = val1i;
                        return true;
                    }

                    var val2 = user.safeName.toLowerCase();
                    var val2i = val2.indexOf(q);
                    if (val2i > -1) {
                        user.atwho_order = val2i + user.username.length;
                        return true;
                    }

                    return false;
                });
                return results;
            }

            function sorter(query, items, search_key) {
                return items.sort(function(a, b) {
                    return a.atwho_order - b.atwho_order;
                });
            }

            var that = this;
            this.getUsers(function(users) {
                that.$('.lcb-entry-input')
                .atwho({
                    at: '@@',
                    data: users,
                    tpl: '<li data-value="@${username}"><img src="https://www.gravatar.com/avatar/${avatar}?s=20" height="20" width="20" /> @${username} <small>${displayName}</small></li>',
                    callbacks: {
                        filter: filter,
                        sorter: sorter,
                        tpl_eval: that.atwhoTplEval
                    }
                });
            });
        },
        atwhoRooms: function() {
            var rooms = this.client.rooms;

            function filter(query, data, searchKey) {
                var q = query.toLowerCase();
                var results = rooms.filter(function(room) {
                    var val = room.attributes.slug.toLowerCase();
                    return val.indexOf(q) > -1;
                });

                return results.map(function(room) {
                    return room.attributes;
                });
            }

            this.$('.lcb-entry-input')
                .atwho({
                    at: '#',
                    search_key: 'slug',
                    callbacks: {
                        filter: filter,
                        tpl_eval: this.atwhoTplEval
                    },
                    tpl: '<li data-value="#${slug}">#${slug} <small>${name}</small></li>'
                });
        },
        atwhoEmotes: function() {
            var that = this;
            this.getEmotes(function(emotes) {
                that.$('.lcb-entry-input')
                .atwho({
                    at: ':',
                    search_key: 'emote',
                    data: emotes,
                    tpl: '<li data-value=":${emote}:"><img src="${image}" height="32" width="32" alt=":${emote}:" /> :${emote}:</li>'
                });
            });
        },
        goodbye: function() {
            swal('Archived!', '"' + this.model.get('name') + '" has been archived.', 'warning');
        },
        updateMeta: function() {
            this.$('.lcb-room-heading .name').text(this.model.get('name'));
            this.$('.lcb-room-heading .slug').text('#' + this.model.get('slug'));
            this.$('.lcb-room-description').text(this.model.get('description'));
        },
        sendMeta: function(e) {
            this.model.set({
                name: this.$('.lcb-room-heading').text(),
                description: this.$('.lcb-room-description').text()
            });
            this.client.events.trigger('rooms:update', {
                id: this.model.id,
                name: this.model.get('name'),
                description: this.model.get('description')
            });
        },
        showEditRoom: function(e) {
            if (e) {
                e.preventDefault();
            }
            this.$('.lcb-room-edit').modal();
        },
        hideEditRoom: function(e) {
            if (e) {
                e.preventDefault();
            }
            this.$('.lcb-room-edit').modal('hide');
        },
        submitEditRoom: function(e) {
            if (e) {
                e.preventDefault();
            }
            var name = this.$('.edit-room input[name="name"]').val();
            var description = this.$('.edit-room textarea[name="description"]').val();
            this.client.events.trigger('rooms:update', {
                id: this.model.id,
                name: name,
                description: description
            });
            this.$('.lcb-room-edit').modal('hide');
        },
        archiveRoom: function(e) {
            var that = this;
            swal({
                title: 'Do you really want to archive "' +
                       this.model.get('name') + '"?',
                text: "You will not be able to open it!",
                type: "error",
                confirmButtonText: "Yes, I'm sure",
                allowOutsideClick: true,
                confirmButtonColor: "#DD6B55",
                showCancelButton: true,
                closeOnConfirm: false,
            }, function(isConfirm) {
                if (isConfirm) {
                    that.$('.lcb-room-edit').modal('hide');
                    that.client.events.trigger('rooms:archive', {
                        room: that.model.id
                    });
                }
            });
        },
        sendMessage: function(e) {
            if (e.type === 'keypress' && e.keyCode !== 13 || e.altKey) return;
            e.preventDefault();
            if (!this.client.status.get('connected')) return;
            var $textarea = this.$('.lcb-entry-input');
            if (!$textarea.val()) return;
            this.client.events.trigger('messages:send', {
                room: this.model.id,
                text: $textarea.val()
            });
            $textarea.val('');
        },
        addMessage: function(message) {
            // Smells like pasta
            message.paste = /\n/i.test(message.text);

            var posted = moment(message.posted);

            // Fragment or new message?
            message.fragment = this.lastMessageOwner === message.owner.id &&
                            posted.diff(this.lastMessagePosted, 'minutes') < 5;

            // Mine? Mine? Mine? Mine?
            message.own = this.client.user.id === message.owner.id;

            // WHATS MY NAME
            message.mentioned = new RegExp('\\B@(' + this.client.user.get('username') + ')(?!@)\\b', 'i').test(message.text);

            // Templatin' time
            var $html = $(this.messageTemplate(message).trim());
            var $text = $html.find('.lcb-message-text');
            $text.html(this.formatMessage($text.html()));
            $html.find('time').updateTimeStamp();
            this.$messages.append($html);
            this.lastMessageOwner = message.owner.id;
            this.lastMessagePosted = posted;
            this.scrollMessages();

            if (!message.historical) {
                window.utils.eggs.message(message.text);
            }
        },
        formatMessage: function(text) {
            return window.utils.message.format(text, this.client.extras || {}, this.client.rooms);
        },
        updateScrollLock: function() {
            this.scrollLocked = this.$messages[0].scrollHeight -
              this.$messages.scrollTop() - 5 <= this.$messages.outerHeight();
            return this.scrollLocked;
        },
        scrollMessages: function(force) {
            if (!force && !this.scrollLocked) {
                return;
            }
            this.$messages[0].scrollTop = this.$messages[0].scrollHeight;
        },
        toggleSidebar: function(e) {
            e && e.preventDefault && e.preventDefault();
            // Target siblings too!
            this.$el.siblings('.lcb-room').andSelf().toggleClass('lcb-room-sidebar-opened');
            // Save to localstorage
            if ($(window).width() > 767) {
                this.scrollMessages();
                store.set('sidebar',
                          this.$el.hasClass('lcb-room-sidebar-opened'));
            }
        },
        destroy: function() {
            this.undelegateEvents();
            this.$el.removeData().unbind();
            this.remove();
            Backbone.View.prototype.remove.call(this);
        },
        poke: function(e) {
            var $target = $(e.currentTarget),
                $root = $target.closest('[data-id],[data-owner]'),
                id = $root.data('owner') || $root.data('id'),
                user = this.model.users.findWhere({
                    id: id
                });
            if (!user) return;
            var $input = this.$('.lcb-entry-input'),
                text = $.trim($input.val()),
                at = (text.length > 0 ? ' ' : '') + '@' + user.get('username') + ' '
            $input.val(text + at).focus();
        }
    });

}(window, $, _);
