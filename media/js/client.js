var Client = (function ($, Mustache, io, connection) {

    var module = {};

    module.Client = function Client() {

        var self = this;

        // Setup vars
		this.$tabs = $('#tabs')
        this.$sidebar = $('#sidebar');
        this.$chat = $('#chat');
        this.$status = $('#status');
        this.$entry = $('#entry');
        this.$userList = $('#user-list');
        this.$messages = $('#chat .messages');
		
        this.templates = {
			event: $('#js-tmpl-event').html(),
            message: $('#js-tmpl-message').html(),
            messageFragment: $('#js-tmpl-message-fragment').html(),
            useritem: $('#js-tmpl-user-list-item').html(),
            imagemessage: $('#js-tmpl-image-message').html()
        };
        this.user = {'name': user};
        this.windowFocus = true;

        // GUI Related stuffs
        //************************

        this.updateStatus = function (status) {
            this.$status.find('.message').html(status);
        };

        this.updatePing = function (status) {
            var d = new Date();
            var ping = (d - self.last_ping) + 'ms';
            self.$status.find('.ping').html(ping);
        };

        this.updateUserlist = function (users) {
            var $userlist = self.$userList;
            $userlist.empty();
            $.each(users, function (i, user) {
                var vars = {
                    avatar: '/media/img/mercury.png', // Temporary
                    name: user.user.displayName
                };
                var html = Mustache.to_html(self.templates.useritem, vars);
                $userlist.append(html);
            });
        };

        this.parseContent = function (text) {
            // TODO: Fix this regex
            var imagePattern = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|][.](jpe?g|png|gif))\b/gim;
            var linkPattern =  /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
            if (text.match(imagePattern)) {
                text = text.replace(imagePattern, '<a class="thumbnail" href="$1" target="_blank"><img src="$1" alt="$1" /></a>');
            } else {
                text = text.replace(linkPattern, '<a href="$1" target="_blank">$1</a>');
            }
            return text;
        };
		
		// TODO: We'll need to make this work for multiple rooms
		this.checkScrollLocked = function () {
			return self.$messages[0].scrollHeight - self.$messages.scrollTop() <= self.$messages.outerHeight()
		};

        this.addMessages = function (data) {
            var messages = self.$messages;
            $.each(data, function (i, message) {
                self.addMessage(message);
            });
        };

        this.addMessage = function (message) {
            var $messages = self.$messages;
			var atBottom = self.checkScrollLocked();
            var vars = {
                text: message.text,
                name: message.name,
                owner: message.ownerID
            };
            var lastMessage = $messages.children('.message:last');
            var html;
            // Should we add a new message or add to a previous one?
            if (message.ownerID === lastMessage.data('owner') &&
                    lastMessage.data('owner')) {
                html = Mustache.to_html(self.templates.messageFragment, vars);
                html = self.parseContent(html);
                // We'll need to appent to a div called
                // fragments inside a message.
                lastMessage.find('.fragments').append(html);
            } else {
                html = Mustache.to_html(self.templates.message, vars);
                html = self.parseContent(html);
                $messages.append(html);
            }
			// Maintain scroll position
			if (atBottom) {
				self.scrollMessagesDown();
			}
        };
        
        // TODO: What the shit is this
        this.addImage = function (image) {
            var messages = self.$messages;
            var vars = {
                url: image.url,
                name: image.name
            };
            var html = Mustache.to_html(self.templates.imagemessage, vars);
            messages.append(html);
            self.scrollMessagesDown();
        };

        this.scrollMessagesDown = function () {
            var $messages = self.$messages;
			$messages.prop({
				scrollTop: $messages.prop('scrollHeight')
			});
        };

        this.addEvent = function (event) {
            var vars = {
                text: event.text
            };
            var html = Mustache.to_html(self.templates.event, vars);
            self.$messages.append(html);
            self.scrollMessagesDown();
        };

        this.setName = function (name) {
            if ($.trim(name)) {
                self.user.name = $.trim(name);
                self.socket.emit('set name',  {
                    name: self.user.name
                });
            }
        };

        this.sendMessage = function (message) {
            var text = $.trim(message);
            self.socket.emit('message',  {
                name: self.user.name || 'Anonymous',
                text: text
            });
        };

        this.getMessageHistory = function (query) {
            self.socket.emit('message history', {});
        };

        this.clearMessages = function (options) {
            self.$messages.empty();
        };

        // Initialization / Connection
        //************************
        this.init = function () {

            // Set window state for client
            $(window).blur(function () {
                self.windowFocus = false;
            });
            $(window).focus(function () {
                self.windowFocus = true;
            });

            // Update status
            this.updateStatus('Connecting...');

            // TODO: Why the hell didn't I add this to config?
            this.socket = io.connect(connection.host, {
                reconnect: true,
                transports: ['websocket', 'flashsocket']
            });

            // Setup ping timer
            this.pingTimer = setInterval(function () {
                var d = new Date();
                self.last_ping = d.getTime();
                self.socket.emit('ping', {});
            }, 1000);

            // Get message history
            self.getMessageHistory();
            self.scrollMessagesDown();

        };

        // Startup!
        this.init();

        // Socket Listeners
        //************************
        this.socket.on('connect', function (data) {
            self.updateStatus('Connected.');
        });

        this.socket.on('ping', function (data) {
            self.updatePing();
        });

        this.socket.on('disconnect', function (data) {
            self.updateStatus('Disconnected.');
        });

        this.socket.on('message', function (data) {
            self.addMessage(data);
        });

        this.socket.on('message history', function (data) {
            self.addMessages(data);
        });

        this.socket.on('join', function (data) {
            self.addEvent(data);
        });

        this.socket.on('user list', function (data) {
            self.updateUserlist(data.users);
        });

        // GUI Listeners
        //************************
		
		this.$tabs.find('.tab').live('click', function() {
			$(this).siblings().removeClass('selected');
			$(this).addClass('selected');
		});

        this.$entry.find('.send').bind('click', function () {
            self.sendMessage(self.$entry.find('textarea').val());
            self.$entry.find('textarea').focus().val('');
        });

        this.$entry.find('textarea').bind('keydown', function (e) {
            var textarea = $(this);
            if (e.which === 13 && $.trim(textarea.val())) {
                self.sendMessage(self.$entry.find('textarea').val());
				self.$entry.find('textarea').focus().val('')
				return false;
            }
        });

        //TEMPORARY
        $('#set-name').click(function () {
            var name = $('#handle').val();
            self.setName(name);
        });
    };

    return module;

}(jQuery, Mustache, io, connection));
