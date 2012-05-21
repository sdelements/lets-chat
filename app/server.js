var _ = require('underscore');

var express = require('express');
var express_namespace = require('express-namespace');
var mongoose = require('mongoose');
var MongoStore = require('connect-mongo')(express);
var swig = require('swig');
var passwordHasher = require('password-hash');

// App stuff
var formValidators = require('./formValidators.js')
var ChatServer = require('./chatServer.js');

// Models
var User = require('./models/user.js');

var requireLogin = function (req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login?next=' + req.path);
    }
};

var Server = function (config) {

    var self = this;

    self.config = config;

	// Setup server
	self.app = express.createServer();

	// Setup session store
	self.sessionStore = new MongoStore({
		host: self.config.db_host,
		db: self.config.db_name
    });

	// Configuration
	self.app.configure(function() {
	
		// Setup template stuffs
		self.app.register('.html', swig);
		self.app.set('view engine', 'html');
		swig.init({
			cache: false,
			root: 'views',
			allowErrors: true // allows errors to be thrown and caught by express
		});
		self.app.set('views', 'views');
		self.app.set('view options', {
			layout: false // Prevents express from fucking up our extend/block tags
		});

		// Express options
		self.app.use(express.bodyParser());
		self.app.use(express.cookieParser());
		self.app.use(express.session({
			key: 'express.sid',
			cookie: {
				httpOnly: false // We have to turn off httpOnly for websockets
			}, 
			secret: self.config.cookie_secret,
			store: self.sessionStore
		}));
		self.app.use('/media', express.static('media'));
		
		self.app.use(self.app.router);
	
	});
	
	// Home Sweet Home
	self.app.get('/', requireLogin, function (req, res) {
		var view = swig.compileFile('chat.html').render({
			'media_url': self.config.media_url,
			'host': self.config.hostname,
			'port': self.config.port,
			'user': req.session.user.displayName
		});
		res.send(view);
	});

	// Login
	self.app.get('/login', function (req, res) {
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
	self.app.all('/logout', function (req, res) {
		req.session.destroy();
		res.redirect('/');
	});

	// Ajax
	self.app.namespace('/ajax', function() {
		// Login
		self.app.post('/login', formValidators.login, function(req, res) {
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
		self.app.post('/register', formValidators.registration, function(req, res) {
			var form = req.form;
			if (form.isValid) {
				// TODO: Check if email is unique
				var passwordHash = passwordHasher.generate(form.password);
				var user = new User({
					email: form.email,
					password: passwordHash,
					firstName: form['first-name'],
					lastName: form['last-name'],
					displayName: form['first-name'] + ' ' + form['last-name']
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