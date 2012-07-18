var ClientGUI = function(client) {

    var self = this;

    this.client = client;

    this.windowFocus = true;

    this.$header = $('header');
    this.$client = $('#client');
    this.$tabs = $('#tabs');
    this.$sidebar = $('#sidebar');
    this.$chat = $('#chat');
    this.$status = $('#status');
    this.$entry = $('#entry');
    this.$userlist = $('#user-list');
    this.$files = $('#files');
    this.$filelist = $('#file-list');
    this.$messages = $('#chat .messages');
    this.$fileupload = $('#fileupload');

    this.templates = {
        event: $('#js-tmpl-event').html(),
        message: $('#js-tmpl-message').html(),
        messageFragment: $('#js-tmpl-message-fragment').html(),
        useritem: $('#js-tmpl-user-list-item').html(),
        fileitem: $('#js-tmpl-file-list-item').html()
    };

    this.layout = {
        adjust: function() {
            var offset = $(window).height() -
                self.$header.outerHeight() -
                parseInt(self.$chat.css('margin-top'), 10) -
                parseInt(self.$chat.css('margin-bottom'), 10) -
                self.$entry.outerHeight();
            self.$messages.height(offset)
        },
        checkScrollLocked: function() {
            return self.$messages[0].scrollHeight - self.$messages.scrollTop() <= self.$messages.outerHeight()
        },
        scrollMessagesDown: function() {
            var $messages = self.$messages;
            $messages.prop({
                scrollTop: $messages.prop('scrollHeight')
            });
        }
    };
    
    this.helpers = {
        parseContent: function(text) {
             // TODO: Fix this regex
            var imagePattern = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|][.](jpe?g|png|gif))\b/gim;
            var linkPattern =  /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
            if (text.match(imagePattern)) {
                text = text.replace(imagePattern, '<a class="thumbnail" href="$1" target="_blank"><img src="$1" alt="$1" /></a>');
            } else {
                text = text.replace(linkPattern, '<a href="$1" target="_blank">$1</a>');
            }
            return text;
        }
    }
    
    this.info = {
        updatePing: function () {
            var d = new Date();
            var ping = (d - self.last_ping) + 'ms';
            self.$status.find('.ping').html(ping);
        },
        updateStatus: function(status) {
            self.$status.find('.message').html(status);
        }
    };
    
    this.userlist = {
        init: function (users) {
            var $userlist = self.$userList;
            self.$userlist.empty();
            $.each(users, function (i, user) {
                self.userlist.add(user);
            });
        },
        add: function(user) {
            var vars = {
                id: user.id,
                cid: user.cid,
                name: user.displayName,
                avatar: user.avatar
            };
            var html = Mustache.to_html(self.templates.useritem, vars);
            self.$userlist.append(html);
        },
        remove: function(cid) {
            self.$userlist.find('[data-cid="' + cid + '"]').remove();
        }
    };
    
    this.messages = {
        init: function(messages) {
            var $messages = self.$messages;
            _.each(messages, function (message) {
                self.messages.add(message)
            });
        },
        add: function(message) {
            var atBottom = self.layout.checkScrollLocked();
            var $messages = self.$messages;
            var vars = {
				id: message.id,
				owner: message.owner,
				avatar: message.avatar,
				name: message.name,
				text: message.text,
				posted: message.posted,
				own: message.owner.id === self.client.state.user.id // Does the current user own this?
            };
            var lastMessage = $messages.children('.message:last');
            var html;
            // Should we add a new message or add to a previous one?
            if (message.owner === lastMessage.data('owner') &&
                    lastMessage.data('owner')) {
                html = Mustache.to_html(self.templates.messageFragment, vars);
                html = self.helpers.parseContent(html);
                // We'll need to appent to a div called
                // fragments inside a message.
                lastMessage.find('.fragments').append(html);
            } else {
                html = Mustache.to_html(self.templates.message, vars);
				// Parse the text without disturbing the HTML
                var $html = $(html);
				var parsedContent = self.helpers.parseContent($html.find('.text').html());
                $html.find('.text').html(parsedContent);
                $messages.append($html);
            }
			// Maintain scroll position
			if (atBottom) {
				self.layout.scrollMessagesDown();
			}
        }
    };
    
    this.listen = function() {
        
        var client = self.client;
        
        self.$entry.find('.send').bind('click', function () {
            client.room.messages.add(self.$entry.find('textarea').val());
            self.$entry.find('textarea').focus().val('');
        });

        self.$entry.find('textarea').bind('keydown', function (e) {
            var textarea = $(this);
            if (e.which === 13) {
                // Send message if there's text
                if ($.trim(textarea.val())) {
                    self.client.room.messages.add(self.$entry.find('textarea').val());
                }
                self.$entry.find('textarea').focus().val('')
                return false;
            }
        });

        // File uploads
        self.$files.find('.toggle-upload').bind('click', function(e) {
            e.preventDefault();
            $(this).toggleClass('open');
            self.$files.find('.upload').toggle();
        });

        self.$fileupload.fileupload({
            dropZone: self.$files
        });

        $(document).bind('drop dragover', function (e) {
            e.preventDefault();
        });

    }();
    
    return this;

};