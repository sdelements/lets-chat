var _ = require('underscore');
var mongoose = require('mongoose');
var express = require('express'); require('express-namespace');
var formValidators = require('./formValidators.js')

var swig = require('swig');
var passwordHasher = require('password-hash');

var ChatServer = require('./chatServer.js');

var User = require('./models/auth.js');

var MemoryStore = express.session.MemoryStore;

var requireLogin = function (req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login?next=' + req.path);
    }
};

var Server = function (config) {

    var self = this;

    this.config = config;

	// Setup server
	var app = express.createServer();
	self.app = app;
	
	// Setup sessions
	var sessionStore = new MemoryStore();
	self.sessionStore = sessionStore;
	
	// Setup template stuffs
	app.register('.html', swig);
	app.set('view engine', 'html');
	swig.init({
		root: 'views',
		allowErrors: true // allows errors to be thrown and caught by express
	});
	app.set('views', 'views');
	app.set('view options', {
		layout: false // Prevents express from fucking up our extend/block tags
	});
	
	// Express options
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({
		key: 'express.sid',
		cookie: {
			httpOnly: false // We have to turn off httpOnly for websockets
		}, 
		secret: self.config.cookie_secret,
		store: sessionStore
	}));
	app.use('/media', express.static('media'));
	
	// Home Sweet Home
	app.get('/', requireLogin, function (req, res) {
		var view = swig.compileFile('chat.html').render({
			'media_url': self.config.media_url,
			'host': self.config.hostname,
			'port': self.config.port,
			'user': req.session.user.displayName
		});
		res.send(view);
	});
	
	// Login
	app.get('/login', function (req, res) {
		var render_login_page = function (errors) {
			return swig.compileFile('login.html').render({
				'media_url': self.config.media_url,
				'next': req.param('next', ''),
				'errors': errors
			});
		};
		res.send(render_login_page());
		// TODO: fix the if statement logic here
	});
	
	// Logout
	app.all('/logout', function (req, res) {
		req.session.destroy();
		res.redirect('/');
	});
	
	// Ajax
	app.namespace('/ajax', function() {
		// Login
		app.post('/login', formValidators.login, function(req, res) {
			var form = req.form;
			if (form.isValid) {
				User.findOne({ 'email': form.email }).run(function (error, user) {
					if (user && passwordHasher.verify(form.password, user.password)) {
						req.session.user = user;
						req.session.save();
						res.send({
							status: 'success',
							message: 'Logging you in...'
						});
					} else {
						res.send({
							status: 'error',
							message: 'Incorrect login credentials.'
						});
					}
				});
			} else {
				res.send({
					status: 'error',
					message: 'Some fields did not validate',
					errors: req.form.errors
				})
			}
		});

		// Register
		app.post('/register', formValidators.registration, function(req, res) {
			var form = req.form;
			if (form.isValid) {
				// TODO: Check if email is unique
				var passwordHash = passwordHasher.generate(form.password);
				var user = new User({
					'email': form.email,
					'password': passwordHash,
					'firstName': form['first-name'],
					'lastName': form['last-name'],
					'displayName': form['first-name']
				}).save(function(err, user) {
					req.session.user = user;
					req.session.save();
					res.send({
						status: 'success',
						message: 'You\'ve been successfully registered.'
					})
				});
			} else {
				res.send({
					status: 'error',
					message: 'Some fields did not validate',
					errors: req.form.errors
				})
			}
		});

	});

    this.start = function () {

		// Connect to mongo
		var db = 'mongodb://' + self.config.db_host + '/' + self.config.db_name;
		mongoose.connect(db, function(err) {
			if (err) throw err;
		});

		// Go go go!
        self.app.listen(config.port);
        self.chatServer = new ChatServer(self.app, self.sessionStore).start();

    };

};

module.exports = Server;
