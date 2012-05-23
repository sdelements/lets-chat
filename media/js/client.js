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
					id: user.id,
                    name: user.displayName,
					avatar: user.avatar
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
				id: message.id,
				owner: message.owner,
				avatar: message.avatar,
				name: message.name,
				text: message.text,
				posted: message.posted
            };
            var lastMessage = $messages.children('.message:last');
            var html;
            // Should we add a new message or add to a previous one?
            if (message.owner === lastMessage.data('owner') &&
                    lastMessage.data('owner')) {
                html = Mustache.to_html(self.templates.messageFragment, vars);
                html = self.parseContent(html);
                // We'll need to appent to a div called
                // fragments inside a message.
                lastMessage.find('.fragments').append(html);
            } else {
                html = Mustache.to_html(self.templates.message, vars);
				// Parse the text without disturbing the HTML
                var $html = $(html);
				var parsedContent = self.parseContent($html.find('.text').html());
                $html.find('.text').html(parsedContent);
                $messages.append($html);
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

        this.sendMessage = function (message) {
            var text = $.trim(message);
            self.socket.emit('message',  {
                text: text
            });
        };

        this.getMessageHistory = function (query) {
            self.socket.emit('message history', {});
        };

        this.clearMessages = function (options) {
            self.$messages.empty();
        };

		this.updateMessageTimestamps = function (){
			self.$messages.find('.message').each(function () {
				var now = moment();
				var posted = $(this).data('posted');
				var $time = $(this).find('time');
				// We'll need to compensate a few seconds
				if (moment(now).diff(posted, 'minutes', true) > 0.5) {
					$time.text(moment(posted).fromNow(true));
				}
			});
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

			// Setup moment.js message timestamps
			setInterval(function () {
				self.updateMessageTimestamps();
			}, 10 * 1000);

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
			self.updateMessageTimestamps();
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

    };

    return module;

}(jQuery, Mustache, io, connection));
