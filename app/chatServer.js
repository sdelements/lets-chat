//
// Letschatbro Server
//

var parseCookie = require('connect').utils.parseCookie;
var Session = require('connect').middleware.session.Session;

var MessageModel = require('./models/message.js');
var UserModel = require('./models/user.js');

var ChatServer = function (app, sessionStore) {

    var self = this;

    this.clients = {};

    this.setupListeners = function () {

        // New client
        this.io.sockets.on('connection', function (client) {
            console.log('A client has joined...');
            var hs = client.handshake;
            var userData = hs.session.user;

            // TODO: Do we need to use private ID here?
            UserModel.findById(userData._id, function (err, user) {
                self.clients[client.id] = {
                    user: user,
                    sid: null
                };
                self.sendClientList();
            });

            // Bind ping
            client.on('ping', function (data) {
                client.emit('ping', {});
            });

            client.on('message', function (incomingMessage) {
				// Set user id on incoming message
                incomingMessage.owner = userData._id;
                // Save message
				var message = self.saveMessage(incomingMessage);
				// Create outgoing message
				var outgoingMessage = {
					id: message._id,
					owner: message.owner,
					name: userData.displayName,
					text: message.text,
					posted: message.posted
				}
                self.io.sockets.emit('message', outgoingMessage);
            });

            client.on('message history', function (data) {
                self.sendMessageHistory(client);
            });

            client.on('set name', function (data) {
                var user = self.clients[client.id].user;
                user.displayName = data.name;
                user.save();
                self.sendClientList(); // TODO: Change this to a general change
            });

            client.on('disconnect', function () {
                delete self.clients[client.id];
                self.sendClientList();
            });

            // Send off an announcement
            client.broadcast.emit('join', {
                name: 'System',
                text: userData.firstName + userData.lastName + ' has signed in'
            });

        });

    };

    this.sendClientList = function () {
        self.io.sockets.emit('user list', {
			users: self.clients
		});
    };

    this.sendMessageHistory = function (client) {
		// Setup query date
		var today = new Date()
		var yesterday = new Date(today).setDate(today.getDate() - 1)
		// Let's find some messages
        MessageModel.where('posted').gte(yesterday)
			.sort('posted', -1).populate('owner')
			.run(function (err, messages) {
				var data = [];
				if (messages) {
					messages.forEach(function (message) {
						data.push({
							id: message._id,
							owner: message.owner._id,
							name: message.owner.displayName,
							text: message.text,
							posted: message.posted
						});
					});
				}
				data.reverse();
				client.emit('message history', data);
        });
    };

    this.saveMessage = function (data) {
        var message = new MessageModel({
            owner: data.owner,
            text: data.text
        })
		message.save();
		return message;
    };

    this.start = function () {
		
        this.io = require('socket.io').listen(app);

        this.io.set('log level', 0);

        this.io.set('authorization', function (data, accept) {
            // This function, courtesy of danielbaulig.de, will parse out session
            // info for connections.
            if (data.headers.cookie) {
                // if there is, parse the cookie
                data.cookie = parseCookie(data.headers.cookie);
                data.sessionID = data.cookie['express.sid'];
                data.sessionStore = sessionStore;
                sessionStore.get(data.sessionID, function (err, session) {
                    if (err || !session) {
                        accept('Error with Sessions', false);
                    } else {
                        data.session = new Session(data, session);
                        accept(null, true);
                    }
                });
            } else {
                // if there isn't, turn down the connection
                return accept('No cookie transmitted.', false);
            }
        });

        // Setup listeners
        this.setupListeners();
		
    };

};

module.exports = ChatServer;
