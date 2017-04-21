'use strict';

if (typeof window !== 'undefined' && typeof exports === 'undefined') {
    if (typeof window.utils !== 'object') {
        window.utils = {};
    }
}

if (typeof exports !== 'undefined') {
    var _ = require('underscore');
}

(function(exports) {
    //
    // Message Text Formatting
    //


    function encodeEntities(value) {
        return value.
            replace(/&/g, '&amp;').
            replace(surrogatePairRegexp, function(value) {
                var hi = value.charCodeAt(0),
                    low = value.charCodeAt(1);
                return '&#' + (((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000) + ';';
            }).
            replace(nonAlphanumericRegexp, function(value) {
                return '&#' + value.charCodeAt(0) + ';';
            }).
            replace(/</g, '&lt;').
            replace(/>/g, '&gt;');
    }

    function getBaseUrl() {
        var parts = window.location.pathname.split('/');

        parts = _.filter(parts, function(part) {
            return part.length;
        });

        var path = window.location.origin;

        if (parts.length) {
            path = path + '/' + parts.join('/');
        }

        return path + '/';
    }

    function trim(text) {
        return text.trim();
    }

    function mentions(text) {
        var mentionPattern = /\B@([\w\.]+)(?!@)\b/g;
        return text.replace(mentionPattern, '<span class="lcb-message-mention">@$1</span>');
    }

    function roomLinks(text, data) {
        if (!data.rooms) {
            return text;
        }

        var slugPattern = /\B(\#[a-z0-9_]+)\b/g;

        return text.replace(slugPattern, function(slug) {
            var s = slug.substring(1);
            var room = data.rooms.find(function(room) {
                return room.attributes.slug === s;
            });

            if (!room) {
                return slug;
            }

            return '<a href="#!/room/' + room.id + '">&#35;' + s + '</a>';
        });
    }

    function uploads(text) {
        var pattern = /^\s*(upload:\/\/[-A-Z0-9+&*@#\/%?=~_|!:,.;'"!()]*)\s*$/i;

        return text.replace(pattern, function(url) {
            return getBaseUrl() + url.substring(9);
        });
    }

    function links(text) {
        if (imagePattern.test(text)) {
            return text.replace(imagePattern, function(url) {
                var uri = encodeEntities(_.unescape(url));
                return '<a class="thumbnail" href="' + uri +
                       '" target="_blank" rel="noreferrer nofollow"><img src="' + uri +
                       '" alt="Pasted Image" /></a>';
            });
        } else {
            return text.replace(linkPattern, function(url) {
                var uri = encodeEntities(_.unescape(url));
                return '<a href="' + uri + '" target="_blank" rel="noreferrer nofollow">' + url + '</a>';
            });
        }
    }

    function emotes(text, data) {
        var regex = new RegExp('\\B(:[a-z0-9_\\+\\-]+:)[\\b]?', 'ig');

        return text.replace(regex, function(group) {
            var key = group.split(':')[1];
            var emote = _.find(data.emotes, function(emote) {
                return emote.emote === key;
            });

            if (!emote) {
                return group;
            }

            var image = _.escape(emote.image),
                emo = _.escape(':' + emote.emote + ':'),
                size = _.escape(emote.size || 20);

            return '<img class="emote" src="' + image + '" title="' + emo + '" alt="' + emo + '" width="' + size + '" height="' + size + '" />';
        });
    }

    function replacements(text, data) {
        _.each(data.replacements, function(replacement) {
            text = text.replace(new RegExp(replacement.regex, 'ig'), replacement.template);
        });
        return text;
    }

    var surrogatePairRegexp = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
        // Match everything outside of normal chars and " (quote character)
        nonAlphanumericRegexp = /([^\#-~| |!])/g,
        imagePattern = /^\s*((https?|ftp):\/\/[-A-Z0-9\u00a1-\uffff+&@#\/%?=~_|!:,.;'"!()]*[-A-Z0-9\u00a1-\uffff+&@#\/%=~_|][.](jpe?g|png|gif))\s*$/i,
        linkPattern = /((https?|ftp):\/\/[-A-Z0-9\u00a1-\uffff+&*@#\/%?=~_|!:,.;'"!()]*[-A-Z0-9\u00a1-\uffff+&@#\/%=~_|])/ig;

    exports.format = function(text, data) {
        var pipeline = [
            trim,
            mentions,
            roomLinks,
            uploads,
            links,
            emotes,
            replacements
        ];

        _.each(pipeline, function(func) {
            text = func(text, data);
        });

        return text;
    };

})(typeof exports === 'undefined' ? window.utils.message = {} : exports);//
// LCB Models
//

var UserModel = Backbone.Model.extend();

var UsersCollection = Backbone.Collection.extend({
    model: UserModel
});

var MessageModel = Backbone.Model.extend();

var MessagesCollection = Backbone.Collection.extend({
    model: MessageModel
});

var FileModel = Backbone.Model.extend();

var FilesCollection = Backbone.Collection.extend({
    model: FileModel
});

var RoomModel = Backbone.Model.extend({
    initialize: function() {
        this.messages = new MessagesCollection();
        this.users = new UsersCollection();
        this.files = new FilesCollection();
        this.lastMessage = new Backbone.Model();
        //
        // Child events
        //
        this.users.on('add', _.bind(function(user) {
            this.trigger('users:add', user, this);
        }, this));
        this.users.on('remove', function(user) {
            this.trigger('users:remove', user, this);
        }, this);
    },
    loaded: false
});

var RoomsCollection = Backbone.Collection.extend({
    model: RoomModel,
    initialize: function() {
        this.current = new Backbone.Model();
        this.last = new Backbone.Model();
    }
});/*
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
            this.$('.lcb-rooms-list-item[data-id=' + room.id + '] .lcb-rooms-list-item-participants').text(room.get('participants'));
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
                    bj = br.get('joined');
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
            var $form = this.$(e.target),
                $modal = this.$('#lcb-add-room'),
                $name = this.$('.lcb-room-name'),
                $slug = this.$('.lcb-room-slug'),
                $description = this.$('.lcb-room-description'),
                $password = this.$('.lcb-room-password'),
                $confirmPassword = this.$('.lcb-room-confirm-password'),
                $private = this.$('.lcb-room-private'),
                data = {
                    name: $name.val().trim(),
                    slug: $slug.val().trim(),
                    description: $description.val(),
                    password: $password.val(),
                    private: !!$private.prop('checked'),
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

}(window, $, _);/*
 * ROOM VIEW
 * TODO: Break it up :/
 */

'use strict';

+function(window, $, _) {

    window.LCB = window.LCB || {};

    window.LCB.RoomView = Backbone.View.extend({
        events: {
            'scroll .lcb-messages': 'updateScrollLock',
            'keypress .lcb-entry-input': 'sendMessage',
            'click .lcb-entry-button': 'sendMessage',
            'click .lcb-room-toggle-sidebar': 'toggleSidebar',
            'click .show-edit-room': 'showEditRoom',
            'click .hide-edit-room': 'hideEditRoom',
            'click .submit-edit-room': 'submitEditRoom',
            'click .archive-room': 'archiveRoom',
            'click .lcb-room-poke': 'poke',
            'click .lcb-upload-trigger': 'upload'
        },
        initialize: function(options) {
            this.client = options.client;

            var iAmOwner = this.model.get('owner') === this.client.user.id;
            var iCanEdit = iAmOwner || !this.model.get('hasPassword');

            this.model.set('iAmOwner', iAmOwner);
            this.model.set('iCanEdit', iCanEdit);

            this.template = options.template;
            this.messageTemplate =
                Handlebars.compile($('#template-message').html());
            this.render();
            this.model.on('messages:new', this.addMessage, this);
            this.model.on('change', this.updateMeta, this);
            this.model.on('remove', this.goodbye, this);
            this.model.users.on('change', this.updateUser, this);

            //
            // Subviews
            //
            this.usersList = new window.LCB.RoomUsersView({
                el: this.$('.lcb-room-sidebar-users'),
                collection: this.model.users
            });
            this.filesList = new window.LCB.RoomFilesView({
                el: this.$('.lcb-room-sidebar-files'),
                collection: this.model.files
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
            this.selectizeParticipants();
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
        getAtwhoUserFilter: function(collection) {
            var currentUser = this.client.user;

            return function filter(query, data, searchKey) {
                var q = query.toLowerCase();
                var results = collection.filter(function(user) {
                    var attr = user.attributes;

                    if (user.id === currentUser.id) {
                        return false;
                    }

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
            };
        },
        atwhoMentions: function () {

            function sorter(query, items, search_key) {
                return items.sort(function(a, b) {
                    return a.atwho_order - b.atwho_order;
                });
            }
            var options = {
                at: '@',
                tpl: '<li data-value="@${username}"><img src="https://www.gravatar.com/avatar/${avatar}?s=20" height="20" width="20" /> @${username} <small>${displayName}</small></li>',
                callbacks: {
                    filter: this.getAtwhoUserFilter(this.model.users),
                    sorter: sorter,
                    tpl_eval: this.atwhoTplEval
                }
            };

            this.$('.lcb-entry-input').atwho(options);
        },
        atwhoAllMentions: function () {
            var that = this;

            function filter(query, data, searchKey) {
                var users = that.client.getUsersSync();
                var filt = that.getAtwhoUserFilter(users);
                return filt(query, data, searchKey);
            }

            function sorter(query, items, search_key) {
                return items.sort(function(a, b) {
                    return a.atwho_order - b.atwho_order;
                });
            }

            var options = {
                at: '@@',
                tpl: '<li data-value="@${username}"><img src="https://www.gravatar.com/avatar/${avatar}?s=20" height="20" width="20" /> @${username} <small>${displayName}</small></li>',
                callbacks: {
                    filter: filter,
                    sorter: sorter,
                    tpl_eval: that.atwhoTplEval
                }
            };

            this.$('.lcb-entry-input').atwho(options);

            var opts = _.extend(options, { at: '@'});
            this.$('.lcb-entry-participants').atwho(opts);
            this.$('.lcb-room-participants').atwho(opts);
        },
        selectizeParticipants: function () {
            var that = this;

            this.$('.lcb-entry-participants').selectize({
                delimiter: ',',
                create: false,
                load: function(query, callback) {
                    if (!query.length) return callback();

                    var users = that.client.getUsersSync();

                    var usernames = users.map(function(user) {
                        return user.attributes.username;
                    });

                    usernames = _.filter(usernames, function(username) {
                        return username.indexOf(query) !== -1;
                    });

                    users = _.map(usernames, function(username) {
                        return {
                            value: username,
                            text: username
                        };
                    });

                    callback(users);
                }
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
            this.client.getEmotes(function(emotes) {
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
            var that = this;
            this.$('.lcb-room-heading .name').text(this.model.get('name'));
            this.$('.lcb-room-heading .slug').text('#' + this.model.get('slug'));
            this.$('.lcb-room-participants').text(this.model.get('participants'));
            this.formatMessage(_.escape(this.model.get('description')), function(html) {
              that.$('.lcb-room-description').html(html);
            });
        },
        showEditRoom: function(e) {
            if (e) {
                e.preventDefault();
            }

            var $modal = this.$('.lcb-room-edit'),
                $name = $modal.find('input[name="name"]'),
                $description = $modal.find('textarea[name="description"]'),
                $password = $modal.find('input[name="password"]'),
                $confirmPassword = $modal.find('input[name="confirmPassword"]');

            $name.val(this.model.get('name'));
            $description.val(this.model.get('description'));
            $password.val('');
            $confirmPassword.val('');

            $modal.modal();
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

            var $modal = this.$('.lcb-room-edit'),
                $name = $modal.find('input[name="name"]'),
                $description = $modal.find('textarea[name="description"]'),
                $password = $modal.find('input[name="password"]'),
                $confirmPassword = $modal.find('input[name="confirmPassword"]'),
                $participants =
                    this.$('.edit-room textarea[name="participants"]');

            $name.parent().removeClass('has-error');
            $confirmPassword.parent().removeClass('has-error');

            if (!$name.val()) {
                $name.parent().addClass('has-error');
                return;
            }

            if ($password.val() && $password.val() !== $confirmPassword.val()) {
                $confirmPassword.parent().addClass('has-error');
                return;
            }

            this.client.events.trigger('rooms:update', {
                id: this.model.id,
                name: $name.val(),
                description: $description.val(),
                password: $password.val(),
                participants: $participants.val()
            });

            $modal.modal('hide');
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
                closeOnConfirm: true,
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
            if (e.type === 'keypress' && e.keyCode === 13 && e.shiftKey) return;
            e.preventDefault();
            if (!this.client.status.get('connected')) return;
            var $textarea = this.$('.lcb-entry-input');
            if (!$textarea.val()) return;
            this.client.events.trigger('messages:send', {
                room: this.model.id,
                text: $textarea.val()
            });
            $textarea.val('');
            this.scrollLocked = true;
            this.scrollMessages();
        },
        addMessage: function(message) {
            // Smells like pasta
            message.paste = /\n/i.test(message.text);

            var posted = moment(message.posted);

            // Fragment or new message?
            message.fragment = this.lastMessageOwner === message.owner.id &&
                            posted.diff(this.lastMessagePosted, 'minutes') < 2;

            // Mine? Mine? Mine? Mine?
            message.own = this.client.user.id === message.owner.id;

            // WHATS MY NAME
            message.mentioned = new RegExp('\\B@(' + this.client.user.get('username') + '|all)(?!@)\\b', 'i').test(message.text);

            // Templatin' time
            var $html = $(this.messageTemplate(message).trim());
            var $text = $html.find('.lcb-message-text');

            var that = this;
            this.formatMessage($text.html(), function(text) {
                $text.html(text);
                $html.find('time').updateTimeStamp();
                that.$messages.append($html);

                if (!message.fragment) {
                    that.lastMessagePosted = posted;
                    that.lastMessageOwner = message.owner.id;
                }

                that.scrollMessages();
            });

        },
        formatMessage: function(text, cb) {
            var client = this.client;
            client.getEmotes(function(emotes) {
                client.getReplacements(function(replacements) {
                    var data = {
                        emotes: emotes,
                        replacements: replacements,
                        rooms: client.rooms
                    };

                    var msg = window.utils.message.format(text, data);
                    cb(msg);
                });
            });
        },
        updateScrollLock: function() {
            this.scrollLocked = this.$messages[0].scrollHeight -
              this.$messages.scrollTop() - 5 <= this.$messages.outerHeight();
            return this.scrollLocked;
        },
        scrollMessages: function(force) {
            if ((!force && !this.scrollLocked) || this.$el.hasClass('hide')) {
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
        },
        upload: function(e) {
            e.preventDefault();
            this.model.trigger('upload:show', this.model);
        },
        updateUser: function(user) {
            var $messages = this.$('.lcb-message[data-owner="' + user.id + '"]');
            $messages.find('.lcb-message-username').text('@' + user.get('username'));
            $messages.find('.lcb-message-displayname').text(user.get('displayName'));
        }
    });

    window.LCB.RoomSidebarListView = Backbone.View.extend({
        initialize: function(options) {
            this.template = Handlebars.compile($(this.templateSelector).html());
            this.collection.on('add remove', function() {
                this.count();
            }, this);
            this.collection.on('add', function(model) {
                this.add(model.toJSON());
            }, this);
            this.collection.on('change', function(model) {
                this.update(model.toJSON());
            }, this);
            this.collection.on('remove', function(model) {
                this.remove(model.id);
            }, this);
            this.render();
        },
        render: function() {
            this.collection.each(function(model) {
                this.add(model.toJSON());
            }, this);
            this.count();
        },
        add: function(model) {
            this.$('.lcb-room-sidebar-list').prepend(this.template(model));
        },
        remove: function(id) {
            this.$('.lcb-room-sidebar-item[data-id=' + id + ']').remove();
        },
        count: function(models) {
            this.$('.lcb-room-sidebar-items-count').text(this.collection.length);
        },
        update: function(model){
            this.$('.lcb-room-sidebar-item[data-id=' + model.id + ']')
                .replaceWith(this.template(model));
        }
    });

    window.LCB.RoomUsersView = window.LCB.RoomSidebarListView.extend({
        templateSelector: '#template-user'
    });

    window.LCB.RoomFilesView = window.LCB.RoomSidebarListView.extend({
        templateSelector: '#template-file'
    });

}(window, $, _);/*
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

}(window, $, _);/*
 * WINDOW VIEW
 * TODO: Break it up :/
 */

'use strict';

+function(window, $, _, notify) {

    window.LCB = window.LCB || {};

    window.LCB.WindowView = Backbone.View.extend({
        el: 'html',
        focus: true,
        count: 0,
        mentions: 0,
        countFavicon: new Favico({
            position: 'down',
            animation: 'none',
            bgColor: '#b94a48'
        }),
        mentionsFavicon: new Favico({
            position: 'left',
            animation: 'none',
            bgColor: '#f22472'
        }),
        initialize: function(options) {

            var that = this;

            this.client = options.client;
            this.rooms = options.rooms;
            this.originalTitle = document.title;
            this.title = this.originalTitle;

            $(window).on('focus blur', _.bind(this.onFocusBlur, this));

            this.rooms.current.on('change:id', function(current, id) {
                var room = this.rooms.get(id),
                    title = room ? room.get('name') : 'Rooms';
                this.updateTitle(title);
            }, this);

            this.rooms.on('change:name', function(room) {
                if (room.id !== this.rooms.current.get('id')) {
                    return;
                }
                this.updateTitle(room.get('name'));
            }, this);

            this.rooms.on('messages:new', this.onNewMessage, this);

            // Last man standing
            _.defer(function() {
                that.updateTitle();
            });

        },
        onFocusBlur: function(e) {
            this.focus = (e.type === 'focus');
            if (this.focus) {
                clearInterval(this.titleTimer);
                clearInterval(this.faviconBadgeTimer);
                this.count = 0;
                this.mentions = 0;
                this.titleTimer = false;
                this.titleTimerFlip = false;
                this.faviconBadgeTimer = false;
                this.faviconBadgeTimerFlip = false;
                this.updateTitle();
                this.mentionsFavicon.reset();
            }
        },
        onNewMessage: function(message) {
            if (this.focus || message.historical || message.owner.id === this.client.user.id) {
                return;
            }
            this.countMessage(message);
            this.flashTitle()
            this.flashFaviconBadge();
        },
        countMessage: function(message) {
            ++this.count;
            message.mentioned && ++this.mentions;
        },
        flashTitle: function() {
            var titlePrefix = '';
            if (this.count > 0) {
                titlePrefix += '(' + parseInt(this.count);
                if (this.mentions > 0) {
                    titlePrefix += '/' + parseInt(this.mentions) + '@';
                }
                titlePrefix += ') ';
            }
            document.title = titlePrefix + this.title;
        },
        flashFaviconBadge: function() {
            if (!this.faviconBadgeTimer) {
                this._flashFaviconBadge();
                var flashFaviconBadge = _.bind(this._flashFaviconBadge, this);
                this.faviconBadgeTimer = setInterval(flashFaviconBadge, 1 * 2000);
            }
        },
        _flashFaviconBadge: function() {
            if (this.mentions > 0 && this.faviconBadgeTimerFlip) {
                this.mentionsFavicon.badge(this.mentions);
            } else {
                this.countFavicon.badge(this.count);
            }
            this.faviconBadgeTimerFlip = !this.faviconBadgeTimerFlip;
        },
        updateTitle: function(name) {
            if (!name) {
                var room = this.rooms.get(this.rooms.current.get('id'));
                name = (room && room.get('name')) || 'Rooms';
            }
            if (name) {
                this.title = name + ' \u00B7 ' + this.originalTitle;
            } else {
                this.title = this.originalTitle;
            }
            document.title = this.title;
        }
    });

    window.LCB.HotKeysView = Backbone.View.extend({
        el: 'html',
        keys: {
            'up+shift+alt down+shift+alt': 'nextRoom',
            's+shift+alt': 'toggleRoomSidebar',
            'g+shift+alt': 'openGiphyModal',
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
        },
        openGiphyModal: function(e) {
            if (this.client.options.giphyEnabled) {
                e.preventDefault();
                $('.lcb-giphy').modal('show');
            }
        }
    });

    window.LCB.DesktopNotificationsView = Backbone.View.extend({
        focus: true,
        openNotifications: [],
        openMentions: [],
        initialize: function(options) {
            notify.config({
                pageVisibility: false
            });
            this.client = options.client;
            this.rooms = options.rooms;
            $(window).on('focus blur unload', _.bind(this.onFocusBlur, this));
            this.rooms.on('messages:new', this.onNewMessage, this);
        },
        onFocusBlur: function(e) {
            this.focus = (e.type === 'focus');
            _.each(_.merge(this.openNotifications, this.openMentions), function(notification) {
                notification.close && notification.close();
            });
        },
        onNewMessage: function(message) {
            if (this.focus || message.historical || message.owner.id === this.client.user.id) {
                return;
            }
            this.createDesktopNotification(message);
        },
        createDesktopNotification: function(message) {

            var that = this;

            if (!notify.isSupported ||
                notify.permissionLevel() != notify.PERMISSION_GRANTED) {
                return;
            }

            var roomID = message.room.id,
                avatar = message.owner.avatar,
                icon = 'https://www.gravatar.com/avatar/' + avatar + '?s=50',
                title = message.owner.displayName + ' in ' + message.room.name,
                mention = message.mentioned;

            var notification = notify.createNotification(title, {
                body: message.text,
                icon: icon,
                tag: message.id,
                onclick: function() {
                    window.focus();
                    that.client.events.trigger('rooms:switch', roomID);
                }
            });

            //
            // Mentions
            //
            if (mention) {
                if (this.openMentions.length > 2) {
                    this.openMentions[0].close();
                    this.openMentions.shift();
                }
                this.openMentions.push(notification);
                // Quit early!
                return;
            }
            //
            // Everything else
            //
            if (this.openNotifications.length > 2) {
                this.openNotifications[0].close();
                this.openNotifications.shift();
            }
            this.openNotifications.push(notification);

            setTimeout(function() {
                notification.close && notification.close();
            }, 3000);

        }
    });

}(window, $, _, notify);/*
 * TABS/PANES VIEW
 */

'use strict';

+function(window, $, _) {

    window.LCB = window.LCB || {};

    window.LCB.TabsView = Backbone.View.extend({
        events: {
            'click .lcb-tab-close': 'leave'
        },
        focus: true,
        initialize: function(options) {
            this.client = options.client;
            this.template = Handlebars.compile($('#template-room-tab').html());
            this.rooms = options.rooms;
            // Room joining
            this.rooms.on('change:joined', function(room, joined) {
                if (joined) {
                    this.add(room.toJSON());
                    return;
                }
                this.remove(room.id);
            }, this);
            // Room meta updates
            this.rooms.on('change:name change:description', this.update, this);
            // Current room switching
            this.rooms.current.on('change:id', function(current, id) {
                this.switch(id);
                this.clearAlerts(id);
            }, this);
            // Alerts
            this.rooms.on('messages:new', this.alert, this);
            // Initial switch since router runs before view is loaded
            this.switch(this.rooms.current.get('id'));
            // Blur/Focus events
            $(window).on('focus blur', _.bind(this.onFocusBlur, this));
            this.render();
        },
        add: function(room) {
            this.$el.append(this.template(room));
        },
        remove: function(id) {
            this.$el.find('.lcb-tab[data-id=' + id + ']').remove();
        },
        update: function(room) {
            this.$el.find('.lcb-tab[data-id=' + room.id + '] .lcb-tab-title').text(room.get('name'));
        },
        switch: function(id) {
            if (!id) {
                id = 'list';
            }
            this.$el.find('.lcb-tab').removeClass('selected')
                .filter('[data-id=' + id + ']').addClass('selected');
        },
        leave: function(e) {
            e.preventDefault();
            var id = $(e.currentTarget).closest('[data-id]').data('id');
            this.client.events.trigger('rooms:leave', id);
        },
        alert: function(message) {
            var $tab = this.$('.lcb-tab[data-id=' + message.room.id + ']'),
                $total = $tab.find('.lcb-tab-alerts-total'),
                $mentions = $tab.find('.lcb-tab-alerts-mentions');
            if (message.historical || $tab.length === 0
                    || ((this.rooms.current.get('id') === message.room.id) && this.focus)) {
                // Nothing to do here!
                return;
            }
            var total = parseInt($tab.data('count-total')) || 0,
                mentions = parseInt($tab.data('count-mentions')) || 0;
            // All messages
            $tab.data('count-total', ++total);
            $total.text(total);
            // Just mentions
            if (new RegExp('\\B@(' + this.client.user.get('username') + ')(?!@)\\b', 'i').test(message.text)) {
                $tab.data('count-mentions', ++mentions);
                $mentions.text(mentions);
            }
        },
        clearAlerts: function(id) {
            var $tab = this.$('.lcb-tab[data-id=' + id + ']'),
                $total = $tab.find('.lcb-tab-alerts-total'),
                $mentions = $tab.find('.lcb-tab-alerts-mentions');
            $tab.data('count-total', 0).data('count-mentions', 0);
            $total.text('');
            $mentions.text('');
        },
        onFocusBlur: function(e) {
            var that = this;
            this.focus = (e.type === 'focus');
            clearTimeout(this.clearTimer);
            if (this.focus) {
                this.clearTimer = setTimeout(function() {
                    that.clearAlerts(that.rooms.current.get('id'));
                }, 1000);
                return;
            }
            that.clearAlerts(that.rooms.current.get('id'));
        }
    });

    window.LCB.PanesView = Backbone.View.extend({
        initialize: function(options) {
            this.client = options.client;
            this.template = Handlebars.compile($('#template-room').html());
            this.rooms = options.rooms;
            this.views = {};
            this.rooms.on('change:joined', function(room, joined) {
                if (joined) {
                    this.add(room);
                    return;
                }
                this.remove(room.id);
            }, this);
            // Switch room
            this.rooms.current.on('change:id', function(current, id) {
                this.switch(id);
            }, this);
            // Initial switch since router runs before view is loaded
            this.switch(this.rooms.current.get('id'));
        },
        switch: function(id) {
            if (!id) {
                id = 'list';
            }
            var $pane = this.$el.find('.lcb-pane[data-id=' + id + ']');
            $pane.removeClass('hide').siblings().addClass('hide');
            $(window).width() > 767 && $pane.find('[autofocus]').focus();
            this.views[id] && this.views[id].scrollMessages(true);
        },
        add: function(room) {
            if (this.views[room.id]) {
                // Nothing to do, this room is already here
                return;
            }
            this.views[room.id] = new window.LCB.RoomView({
                client: this.client,
                template: this.template,
                model: room
            });
            this.$el.append(this.views[room.id].$el);
        },
        remove: function(id) {
            if (!this.views[id]) {
                // Nothing to do here
                return;
            }
            this.views[id].destroy();
            delete this.views[id];
        }
    });

}(window, $, _);/*
 * MODAL VIEWS
 */

'use strict';

+function(window, $, _) {

    window.LCB = window.LCB || {};

    window.LCB.ModalView = Backbone.View.extend({
        events: {
        	'submit form': 'submit'
        },
        initialize: function(options) {
            this.render();
        },
        render: function() {
            this.$('form.validate').validate();
            this.$el.on('shown.bs.modal hidden.bs.modal',
                        _.bind(this.refresh, this));
        },
        refresh: function() {
            var that = this;
            this.$('[data-model]').each(function() {
                $(this).val && $(this).val(that.model.get($(this).data('model')));
            });
        },
        success: function() {
            swal('Updated!', '', 'success');
            this.$el.modal('hide');
        },
        error: function() {
            swal('Woops!', '', 'error');
        },
        submit: function(e) {
        	e && e.preventDefault();

            var $form = this.$('form[action]');
            var opts = {
                type: $form.attr('method') || 'POST',
                url: $form.attr('action'),
                data: $form.serialize(),
                dataType: 'json'
            };

            if (this.success) {
                opts.success = _.bind(this.success, this);
            }
            if (this.error) {
                opts.error = _.bind(this.error, this);
            }
            if (this.complete) {
                opts.complete = _.bind(this.complete, this);
            }

            $.ajax(opts);
        }
    });

    window.LCB.ProfileModalView = window.LCB.ModalView.extend({
        success: function() {
            swal('Profile Updated!', 'Your profile has been updated.',
                 'success');
            this.$el.modal('hide');
        },
        error: function() {
            swal('Woops!', 'Your profile was not updated.', 'error');
        }
    });

    window.LCB.AccountModalView = window.LCB.ModalView.extend({
        success: function() {
            swal('Account Updated!', 'Your account has been updated.', 'success');
            this.$el.modal('hide');
            this.$('[type="password"]').val('');
        },
        error: function(req) {
            var message = req.responseJSON && req.responseJSON.reason ||
                          'Your account was not updated.';

            swal('Woops!', message, 'error');
        },
        complete: function() {
            this.$('[name="current-password"]').val('');
        }
    });

    window.LCB.RoomPasswordModalView = Backbone.View.extend({
        events: {
            'click .btn-primary': 'enterRoom'
        },
        initialize: function(options) {
            this.render();
            this.$name = this.$('.lcb-room-password-name');
            this.$password = this.$('input.lcb-room-password-required');
        },
        render: function() {
            // this.$el.on('shown.bs.modal hidden.bs.modal',
            //             _.bind(this.refresh, this));
        },
        show: function(options) {
            this.callback = options.callback;
            this.$password.val('');
            this.$name.text(options.roomName || '');
            this.$el.modal('show');
        },
        enterRoom: function() {
            this.$el.modal('hide');
            this.callback(this.$password.val());
        }
    });

    window.LCB.AuthTokensModalView = Backbone.View.extend({
        events: {
            'click .generate-token': 'generateToken',
            'click .revoke-token': 'revokeToken'
        },
        initialize: function(options) {
            this.render();
        },
        render: function() {
            this.$el.on('shown.bs.modal hidden.bs.modal',
                        _.bind(this.refresh, this));
        },
        refresh: function() {
            this.$('.token').val('');
            this.$('.generated-token').hide();
        },
        getToken: function() {
            var that = this;
            $.post('./account/token/generate', function(data) {
                if (data.token) {
                    that.$('.token').val(data.token);
                    that.$('.generated-token').show();
                }
            });
        },
        removeToken: function() {
            var that = this;
            $.post('./account/token/revoke', function(data) {
                that.refresh();
                swal('Success', 'Authentication token revoked!', 'success');
            });
        },
        generateToken: function() {
            swal({
                title: 'Are you sure?',
                text: 'This will overwrite any existing authentication token you may have.',   type: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes',
                closeOnConfirm: true },
                _.bind(this.getToken, this)
            );
        },
        revokeToken: function() {
            swal({
                title: 'Are you sure?',
                text: 'This will revoke access from any process using your current authentication token.',   type: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes',
                closeOnConfirm: false },
                _.bind(this.removeToken, this)
            );
        }
    });

    window.LCB.NotificationsModalView = Backbone.View.extend({
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
            var that = this;
            if (!notify.isSupported) {
                return;
            }
            notify.requestPermission(function() {
                that.render();
            });
        }
    });

    window.LCB.GiphyModalView = Backbone.View.extend({
        events: {
            'keypress .search-giphy': 'stopReturn',
            'keyup .search-giphy': 'loadGifs'
        },
        initialize: function(options) {
            this.render();
        },
        render: function() {
            this.$el.on('shown.bs.modal hidden.bs.modal',
                        _.bind(this.refresh, this));
        },
        refresh: function() {
            this.$el.find('.giphy-results ul').empty();
            this.$('.search-giphy').val('').focus();
        },
        stopReturn: function(e) {
            if(e.keyCode === 13) {
                return false;
            }
        },
        loadGifs: _.debounce(function() {
            var that = this;
            var search = this.$el.find('.search-giphy').val();

            $.get('https://api.giphy.com/v1/gifs/search', {
                q: search,
                rating: this.$el.data('rating'),
                limit: this.$el.data('limit'),
                api_key: this.$el.data('apikey')
            })
            .done(function(result) {
                var images = result.data.filter(function(entry) {
                    return entry.images.fixed_width.url;
                }).map(function(entry) {
                    return entry.images.fixed_width.url;
                });

                that.appendGifs(images);
            });
        }, 400),
        appendGifs: function(images) {
            var eles = images.map(function(url) {
                var that = this;
                var $img = $('<img src="' + url +
                       '" alt="gif" data-dismiss="modal"/></li>');

                $img.click(function() {
                    var src = $(this).attr('src');
                    $('.lcb-entry-input:visible').val(src);
                    $('.lcb-entry-button:visible').click();
                    that.$el.modal('hide');
                });

                return $("<li>").append($img);
            }, this);

            var $div = this.$el.find('.giphy-results ul');

            $div.empty();

            eles.forEach(function($ele) {
                $div.append($ele);
            });
        }
    });

}(window, $, _);/*
 * UPLOAD/FILE VIEWS
 * The king of all views.
 */

'use strict';

Dropzone && (Dropzone.autoDiscover = false);

+function(window, $, _) {

    window.LCB = window.LCB || {};

    window.LCB.UploadView = Backbone.View.extend({
        events: {
            'submit form': 'submit'
        },
        initialize: function(options) {
            this.template = $('#template-upload').html();
            this.rooms = options.rooms;
            this.rooms.current.on('change:id', this.setRoom, this);
            this.rooms.on('add remove', this.populateRooms, this);
            this.rooms.on('change:joined', this.populateRooms, this);
            this.rooms.on('upload:show', this.show, this);
            this.render();
        },
        render: function() {
            //
            // Dropzone
            //
            var $ele = this.$el.closest('.lcb-client').get(0);
            this.dropzone = new Dropzone($ele, {
                url: './files',
                autoProcessQueue: false,
                clickable: [this.$('.lcb-upload-target').get(0)],
                previewsContainer: this.$('.lcb-upload-preview-files').get(0),
                addRemoveLinks: true,
                dictRemoveFile: 'Remove',
                parallelUploads: 8,
                maxFiles: 8,
                previewTemplate: this.template
            });
            this.dropzone
                .on('sending', _.bind(this.sending, this))
                .on('sendingmultiple', _.bind(this.sending, this))
                .on('addedfile', _.bind(this.show, this))
                .on('queuecomplete', _.bind(this.complete, this));
            //
            // Selectize
            //
            this.selectize = this.$('select[name="room"]').selectize({
                valueField: 'id',
				labelField: 'name',
				searchField: 'name'
            }).get(0).selectize;
            //
            // Modal events
            //
            this.$el.on('hidden.bs.modal', _.bind(this.clear, this));
            this.$el.on('shown.bs.modal', _.bind(this.setRoom, this));
        },
        show: function() {
            this.$el.modal('show');
        },
        hide: function() {
            this.$el.modal('hide');
        },
        clear: function() {
            this.dropzone.removeAllFiles();
        },
        complete: function(e) {
            var remaining = _.some(this.dropzone.files, function(file) {
                return file.status !== 'success';
            });
            if (remaining) {
                swal('Woops!', 'There were some issues uploading your files.', 'warning');
                return;
            }
            this.hide();
            swal('Success', 'Files uploaded!', 'success');
        },
        sending: function(file, xhr, formData) {
            formData.append('room', this.$('select[name="room"]').val());
            formData.append('post', this.$('input[name="post"]').is(':checked'));
        },
        submit: function(e) {
            e.preventDefault();
            if (!this.$('select[name="room"]').val()) {
                swal('Woops!', 'Please specify a room.', 'warning');
                return;
            }
            this.dropzone.processQueue();
        },
        setRoom: function() {
            this.selectize.setValue(this.rooms.current.id);
        },
        populateRooms: function() {
            this.selectize.clearOptions();
            this.rooms.each(function(room) {
                if (room.get('joined')) {
                    this.selectize.addOption({
                        id: room.id,
                        name: room.get('name')
                    });
                }
            }, this);
        }
    });

}(window, $, _);/*
 * CLIENT VIEW
 * The king of all views.
 */

'use strict';

+function(window, $, _) {

    window.LCB = window.LCB || {};

    window.LCB.ClientView = Backbone.View.extend({
        el: '#lcb-client',
        events: {
            'click .lcb-tab': 'toggleSideBar',
            'click .lcb-header-toggle': 'toggleSideBar'
        },
        initialize: function(options) {
            this.client = options.client;
            //
            // Subviews
            //
            this.browser = new window.LCB.BrowserView({
                el: this.$el.find('.lcb-rooms-browser'),
                rooms: this.client.rooms,
                client: this.client
            });
            this.tabs = new window.LCB.TabsView({
                el: this.$el.find('.lcb-tabs'),
                rooms: this.client.rooms,
                client: this.client
            });
            this.panes = new window.LCB.PanesView({
                el: this.$el.find('.lcb-panes'),
                rooms: this.client.rooms,
                client: this.client
            });
            this.window = new window.LCB.WindowView({
                rooms: this.client.rooms,
                client: this.client
            });
            this.hotKeys = new window.LCB.HotKeysView({
                rooms: this.client.rooms,
                client: this.client
            });
            this.status = new window.LCB.StatusView({
                el: this.$el.find('.lcb-status-indicators'),
                client: this.client
            });
            this.accountButton = new window.LCB.AccountButtonView({
                el: this.$el.find('.lcb-account-button'),
                model: this.client.user
            });
            this.desktopNotifications = new window.LCB.DesktopNotificationsView({
                rooms: this.client.rooms,
                client: this.client
            });
            if (this.client.options.filesEnabled) {
                this.upload = new window.LCB.UploadView({
                    el: this.$el.find('#lcb-upload'),
                    rooms: this.client.rooms
                });
            }

            //
            // Modals
            //
            this.profileModal = new window.LCB.ProfileModalView({
                el: this.$el.find('#lcb-profile'),
                model: this.client.user
            });
            this.accountModal = new window.LCB.AccountModalView({
                el: this.$el.find('#lcb-account'),
                model: this.client.user
            });
            this.tokenModal = new window.LCB.AuthTokensModalView({
                el: this.$el.find('#lcb-tokens')
            });
            this.notificationsModal = new window.LCB.NotificationsModalView({
                el: this.$el.find('#lcb-notifications')
            });
            this.giphyModal = new window.LCB.GiphyModalView({
                el: this.$el.find('#lcb-giphy')
            });
            //
            // Misc
            //
            this.client.status.once('change:connected', _.bind(function(status, connected) {
                this.$el.find('.lcb-client-loading').hide(connected);
            }, this));
            return this;
        },
        toggleSideBar: function(e) {
            this.$el.toggleClass('lcb-sidebar-opened');
        }
    });

    window.LCB.AccountButtonView = Backbone.View.extend({
        initialize: function() {
            this.model.on('change', this.update, this);
        },
        update: function(user){
            this.$('.lcb-account-button-username').text('@' + user.get('username'));
            this.$('.lcb-account-button-name').text(user.get('displayName'));
        }
    });


}(window, $, _);//
// LCB Client
//

(function(window, $, _) {

    //
    // Base
    //
    var Client = function(options) {
        this.options = options;
        this.status = new Backbone.Model();
        this.user = new UserModel();
        this.users = new UsersCollection();
        this.rooms = new RoomsCollection();
        this.events = _.extend({}, Backbone.Events);
        return this;
    };
    //
    // Account
    //
    Client.prototype.getUser = function() {
        var that = this;
        this.socket.emit('account:whoami', function(user) {
            that.user.set(user);
        });
    };
    Client.prototype.updateProfile = function(profile) {
        var that = this;
        this.socket.emit('account:profile', profile, function(user) {
            that.user.set(user);
        });
    };

    //
    // Rooms
    //
    Client.prototype.createRoom = function(data) {
        var that = this;
        var room = {
            name: data.name,
            slug: data.slug,
            description: data.description,
            password: data.password,
            participants: data.participants,
            private: data.private
        };
        var callback = data.callback;
        this.socket.emit('rooms:create', room, function(room) {
            if (room && room.errors) {
                swal("Unable to create room",
                     "Room slugs can only contain lower case letters, numbers or underscores!",
                     "error");
            } else if (room && room.id) {
                that.addRoom(room);
                that.switchRoom(room.id);
            }
            callback && callback(room);
        });
    };
    Client.prototype.getRooms = function(cb) {
        var that = this;
        this.socket.emit('rooms:list', { users: true }, function(rooms) {
            that.rooms.set(rooms);
            // Get users for each room!
            // We do it here for the room browser
            _.each(rooms, function(room) {
                if (room.users) {
                    that.setUsers(room.id, room.users);
                }
            });

            if (cb) {
                cb(rooms);
            }
        });
    };
    Client.prototype.switchRoom = function(id) {
        // Make sure we have a last known room ID
        this.rooms.last.set('id', this.rooms.current.get('id'));
        if (!id || id === 'list') {
            this.rooms.current.set('id', 'list');
            this.router.navigate('!/', {
                replace: true
            });
            return;
        }
        var room = this.rooms.get(id);
        if (room && room.get('joined')) {
            this.rooms.current.set('id', id);
            this.router.navigate('!/room/' + room.id, {
                replace: true
            });
            return;
        } else if(room) {
            this.joinRoom(room, true);
        } else {
            this.joinRoom({id: id}, true);
        }
    };
    Client.prototype.updateRoom = function(room) {
        this.socket.emit('rooms:update', room);
    };
    Client.prototype.roomUpdate = function(resRoom) {
        var room = this.rooms.get(resRoom.id);
        if (!room) {
            this.addRoom(resRoom);
            return;
        }
        room.set(resRoom);
    };
    Client.prototype.addRoom = function(room) {
        var r = this.rooms.get(room.id);
        if (r) {
            return r;
        }
        return this.rooms.add(room);
    };
    Client.prototype.archiveRoom = function(options) {
        this.socket.emit('rooms:archive', options, function(data) {
            if (data !== 'No Content') {
                swal('Unable to Archive!',
                     'Unable to archive this room!',
                     'error');
            }
        });
    };
    Client.prototype.roomArchive = function(room) {
        this.leaveRoom(room.id);
        this.rooms.remove(room.id);
    };
    Client.prototype.rejoinRoom = function(room) {
        this.joinRoom(room, undefined, true);
    };
    Client.prototype.lockJoin = function(id) {
        if (_.contains(this.joining, id)) {
            return false;
        }

        this.joining = this.joining || [];
        this.joining.push(id);
        return true;
    };
    Client.prototype.unlockJoin = function(id) {
        var that = this;
        _.defer(function() {
            that.joining = _.without(that.joining, id);
        });
    };
    Client.prototype.joinRoom = function(room, switchRoom, rejoin) {
        if (!room || !room.id) {
            return;
        }

        var that = this;
        var id = room.id;
        var password = room.password;

        if (!rejoin) {
            // Must not have already joined
            var room1 = that.rooms.get(id);
            if (room1 && room1.get('joined')) {
                return;
            }
        }

        if (!this.lockJoin(id)) {
            return;
        }

        var passwordCB = function(password) {
            room.password = password;
            that.joinRoom(room, switchRoom, rejoin);
        };

        this.socket.emit('rooms:join', {roomId: id, password: password}, function(resRoom) {
            // Room was likely archived if this returns
            if (!resRoom) {
                return;
            }

            if (resRoom && resRoom.errors &&
                resRoom.errors === 'password required') {

                that.passwordModal.show({
                    roomName: resRoom.roomName,
                    callback: passwordCB
                });

                that.unlockJoin(id);
                return;
            }

            if (resRoom && resRoom.errors) {
                that.unlockJoin(id);
                return;
            }

            var room = that.addRoom(resRoom);
            room.set('joined', true);

            if (room.get('hasPassword')) {
                that.getRoomUsers(room.id, _.bind(function(users) {
                    this.setUsers(room.id, users);
                }, that));
            }

            // Get room history
            that.getMessages({
                room: room.id,
                since_id: room.lastMessage.get('id'),
                take: 200,
                expand: 'owner, room',
                reverse: true
            }, function(messages) {
                messages.reverse();
                that.addMessages(messages, !rejoin && !room.lastMessage.get('id'));
                !rejoin && room.lastMessage.set(messages[messages.length - 1]);
            });

            if (that.options.filesEnabled) {
                that.getFiles({
                    room: room.id,
                    take: 15
                }, function(files) {
                    files.reverse();
                    that.setFiles(room.id, files);
                });
            }
            // Do we want to switch?
            if (switchRoom) {
                that.switchRoom(id);
            }
            //
            // Add room id to User Open rooms list.
            //

            var orooms = that.user.get('openRooms');
            if ( ! _.contains(orooms,id)) {
              orooms.push(id);
            }
            that.socket.emit('account:profile', {'openRooms': orooms });

            that.unlockJoin(id);
        });
    };
    Client.prototype.leaveRoom = function(id) {
        var room = this.rooms.get(id);
        if (room) {
            room.set('joined', false);
            room.lastMessage.clear();
            if (room.get('hasPassword')) {
                room.users.set([]);
            }
        }
        this.socket.emit('rooms:leave', id);
        if (id === this.rooms.current.get('id')) {
            var room = this.rooms.get(this.rooms.last.get('id'));
            this.switchRoom(room && room.get('joined') ? room.id : '');
        }
        // Remove room id from User open rooms list.
        var orooms = this.user.get('openRooms');
        orooms = _.without(orooms, id);
        this.socket.emit('account:profile', {'openRooms': orooms});

    };
    Client.prototype.getRoomUsers = function(id, callback) {
        this.socket.emit('rooms:users', {
            room: id
        }, callback);
    };
    //
    // Messages
    //
    Client.prototype.addMessage = function(message) {
        var room = this.rooms.get(message.room);
        if (!room || !message) {
            // Unknown room, nothing to do!
            return;
        }
        room.set('lastActive', message.posted);
        if (!message.historical) {
            room.lastMessage.set(message);
        }
        room.trigger('messages:new', message);
    };
    Client.prototype.addMessages = function(messages, historical) {
        _.each(messages, function(message) {
            if (historical) {
                message.historical = true;
            }
            this.addMessage(message);
        }, this);
    };
    Client.prototype.sendMessage = function(message) {
        this.socket.emit('messages:create', message);
    };
    Client.prototype.getMessages = function(query, callback) {
        this.socket.emit('messages:list', query, callback);
    };
    //
    // Files
    //
    Client.prototype.getFiles = function(query, callback) {
        this.socket.emit('files:list', {
            room: query.room || '',
            take: query.take || 40,
            expand: query.expand || 'owner'
        }, callback);
    };
    Client.prototype.setFiles = function(roomId, files) {
        if (!roomId || !files || !files.length) {
            // Nothing to do here...
            return;
        }
        var room = this.rooms.get(roomId);
        if (!room) {
            // No room
            return;
        }
        room.files.set(files);
    };
    Client.prototype.addFile = function(file) {
        var room = this.rooms.get(file.room);
        if (!room) {
            // No room
            return;
        }
        room.files.add(file);
    };
    //
    // Users
    //
    Client.prototype.setUsers = function(roomId, users) {
        if (!roomId || !users || !users.length) {
            // Data is not valid
            return;
        }
        var room = this.rooms.get(roomId);
        if (!room) {
            // No room
            return;
        }
        room.users.set(users);
    };
    Client.prototype.addUser = function(user) {
        var room = this.rooms.get(user.room);
        if (!room) {
            // No room
            return;
        }
        room.users.add(user);
    };
    Client.prototype.removeUser = function(user) {
        var room = this.rooms.get(user.room);
        if (!room) {
            // No room
            return;
        }
        room.users.remove(user.id);
    };
    Client.prototype.updateUser = function(user) {
        // Update if current user
        if (user.id == this.user.id) {
            this.user.set(user);
        }
        // Update all rooms
        this.rooms.each(function(room) {
            var target = room.users.findWhere({
                id: user.id
            });
            target && target.set(user);
        }, this);
    };
    Client.prototype.getUsersSync = function() {
        if (this.users.length) {
            return this.users;
        }

        var that = this;

        function success(users) {
            that.users.set(users);
        }

        $.ajax({url:'./users', async: false, success: success});

        return this.users;
    };
    //
    // Extras
    //
    Client.prototype.getEmotes = function(callback) {
        this.extras = this.extras || {};
        if (!this.extras.emotes) {
            // Use AJAX, so we can take advantage of HTTP caching
            // Also, it's a promise - which ensures we only load emotes once
            this.extras.emotes = $.get('./extras/emotes');
        }
        if (callback) {
            this.extras.emotes.done(callback);
        }
    };
    Client.prototype.getReplacements = function(callback) {
        this.extras = this.extras || {};
        if (!this.extras.replacements) {
            // Use AJAX, so we can take advantage of HTTP caching
            // Also, it's a promise - which ensures we only load emotes once
            this.extras.replacements = $.get('./extras/replacements');
        }
        if (callback) {
            this.extras.replacements.done(callback);
        }
    };

    //
    // Router Setup
    //
    Client.prototype.route = function() {
        var that = this;
        var Router = Backbone.Router.extend({
            routes: {
                '!/room/': 'list',
                '!/room/:id': 'join',
                '*path': 'list'
            },
            join: function(id) {
                that.switchRoom(id);
            },
            list: function() {
                that.switchRoom('list');
            }
        });
        this.router = new Router();
        Backbone.history.start();
    };
    //
    // Listen
    //
    Client.prototype.listen = function() {
        var that = this;

        function joinRooms(rooms) {
            //
            // Join rooms from User's open Rooms List.
            // We need to check each room is available before trying to join
            //
            var roomIds = _.map(rooms, function(room) {
                return room.id;
            });

            var openRooms = that.user.get('openRooms') || [];

            // Let's open some rooms!
            _.defer(function() {
                //slow down because router can start a join with no password
                _.each(openRooms, function(id) {
                    if (_.contains(roomIds, id)) {
                        that.joinRoom({ id: id });
                    }
                });
            }.bind(this));
        }

        var path = '/' + _.compact(
            window.location.pathname.split('/').concat(['socket.io'])
        ).join('/');

        //
        // Socket
        //
        this.socket = io.connect({
            path: path,
            reconnection: true,
            reconnectionDelay: 500,
            reconnectionDelayMax: 1000,
            timeout: 3000
        });
        this.socket.on('connect', function() {
            that.getUser();
            that.getRooms(joinRooms);
            that.status.set('connected', true);
        });
        this.socket.on('reconnect', function() {
            _.each(that.rooms.where({ joined: true }), function(room) {
                that.rejoinRoom(room);
            });
        });
        this.socket.on('messages:new', function(message) {
            that.addMessage(message);
        });
        this.socket.on('rooms:new', function(data) {
            that.addRoom(data);
        });
        this.socket.on('rooms:update', function(room) {
            that.roomUpdate(room);
        });
        this.socket.on('rooms:archive', function(room) {
            that.roomArchive(room);
        });
        this.socket.on('users:join', function(user) {
            that.addUser(user);
        });
        this.socket.on('users:leave', function(user) {
            that.removeUser(user);
        });
        this.socket.on('users:update', function(user) {
            that.updateUser(user);
        });
        this.socket.on('files:new', function(file) {
            that.addFile(file);
        });
        this.socket.on('disconnect', function() {
            that.status.set('connected', false);
        });
        //
        // GUI
        //
        this.events.on('messages:send', this.sendMessage, this);
        this.events.on('rooms:update', this.updateRoom, this);
        this.events.on('rooms:leave', this.leaveRoom, this);
        this.events.on('rooms:create', this.createRoom, this);
        this.events.on('rooms:switch', this.switchRoom, this);
        this.events.on('rooms:archive', this.archiveRoom, this);
        this.events.on('profile:update', this.updateProfile, this);
        this.events.on('rooms:join', this.joinRoom, this);
    };
    //
    // Start
    //
    Client.prototype.start = function() {
        this.getEmotes();
        this.getReplacements();
        this.listen();
        this.route();
        this.view = new window.LCB.ClientView({
            client: this
        });
        this.passwordModal = new window.LCB.RoomPasswordModalView({
            el: $('#lcb-password')
        });
        return this;
    };
    //
    // Add to window
    //
    window.LCB = window.LCB || {};
    window.LCB.Client = Client;
})(window, $, _);//(=) require util/message.js
//(=) require models.js
//(=) require views/browser.js
//(=) require views/room.js
//(=) require views/status.js
//(=) require views/window.js
//(=) require views/panes.js
//(=) require views/modals.js
//(=) require views/upload.js
//(=) require views/client.js
//(=) require client.js

$(function() {
    window.client = new window.LCB.Client({
        filesEnabled: $('#lcb-upload').length > 0,
        giphyEnabled: $('#lcb-giphy').length > 0
    });
    window.client.start();
});