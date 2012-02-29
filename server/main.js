// Letschatbro Server

// Setup async
var async = require('async');


// Set config vars
var configuration = require('./configuration.js');
var PORT = configuration.get('port');

// Setup mongo
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/letschatbro');

// Load models
var MessageModel = require('./models/message.js');

function Server() {

	var self = this;
	
	// Setup vars
	this.clients = {};

	this.init = function() {

		console.log('Starting up bro...');

		// Listening
		this.io = require('socket.io').listen(PORT);
		
		// Setup listeners
		this.setupListeners();

	}

	this.setupListeners = function () {

		// New client
		this.io.sockets.on('connection', function (client) {

			console.log('What a nice client bro...');
			
			// Add to clients list
			self.clients[client.id] = {
				name: 'Anonymous',
				sid: null
			}
			self.sendClientList();

			// Bind ping
			client.on('ping', function(data) {
				client.emit('ping', {});
				console.log('Got ping...');
			});

			client.on('message', function(data) {
				// Send message to everyone
				self.io.sockets.emit('message', data);
				self.saveMessage(data);
			});

			client.on('message history', function(data) {
				self.sendMessageHistory(client);
			});
			
			client.on('set name', function(data) {
				self.clients[client.id].name = data.name;
				self.sendClientList(); // TODO: Change this to a general change
			});

			client.on('disconnect', function() {
				delete self.clients[client.id];
				self.sendClientList();
			});

			// Send off an announcement
			self.io.sockets.emit('join', {
				name: 'System',
				text: 'A wild anonymoose appears!'
			});

		});

	}
	
	this.sendClientList = function() {
		self.io.sockets.emit('user list', { users: self.clients });
	}

	this.sendMessageHistory = function(client, query) {
		MessageModel.find().limit(30).sort('posted', -1).run(function(err, docs) {
			var data = [];
			docs.forEach(function(doc) {
				data.push({
					id: doc._id,
					name: doc.owner,
					text: doc.text,
					posted: doc.posted
				})
			});
			client.emit('message history', data);
		});
	}

	this.saveMessage = function(message) {
		console.log('Saving message...');
		new MessageModel({
			owner: message.name,
			text: message.text
		}).save();
	} 

	// Cleanup
	this.die = function() {
		console.log('Holy shit bro, we goin down...');
	}

}

var server = new Server().init();