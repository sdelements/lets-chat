//
// Letschatbro Server
//

var _ = require('underscore');

var fs = require('fs');
var express = require('express');
var expressNamespace = require('express-namespace');
var mongoose = require('mongoose');
var MongoStore = require('connect-mongo')(express);
var swig = require('swig');
var hash = require('node_hash');

// App stuff
var formValidators = require('./formValidators.js')
var ChatServer = require('./chatServer.js');

// Models
var User = require('./models/user.js');
var File = require('./models/file.js');

// TODO: We should require login on all routes
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
	self.app.configure(function () {

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

		// Static directory
		self.app.use('/media', express.static('media'));

		self.app.use(self.app.router);
	
	});

	// Home Sweet Home
	self.app.get('/', requireLogin, function (req, res) {
		var user = req.session.user;
		var view = swig.compileFile('chat.html').render({
			media_url: self.config.media_url,
			host: self.config.hostname,
			port: self.config.port,
			user_id: user._id,
			user_email: user.email,
			user_avatar: hash.md5(user.email),
			user_displayname: user.displayName,
			user_lastname: user.lastName,
			user_firstname: user.firstName
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
	self.app.namespace('/ajax', function () {
		// Login
		self.app.post('/login', formValidators.login, function (req, res) {
			var form = req.form;
			if (form.isValid) {
				User.findOne({ 'email': form.email }).run(function (error, user) {
					var hashedPassword = hash.sha256(form.password, self.config.password_salt)
					if (user && hashedPassword === user.password) {
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
		self.app.post('/register', formValidators.registration, function (req, res) {
			var form = req.form;
			if (form.isValid) {
				// TODO: Check if email is unique
				var hashedPassword = hash.sha256(form.password, self.config.password_salt)
				var user = new User({
					email: form.email,
					password: hashedPassword,
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

		// File uploadin'
		self.app.post('/upload-file', function (req, res) {
			var moveUpload = function (path, newPath, callback) {
				fs.readFile(path, function (err, data) {
					fs.writeFile(newPath, data, function (err) {
						callback();
					});
				});
			}
			_.each(req.files, function (file) {
				var owner = req.session.user;
				var allowed_file_types = self.config.allowed_file_types;
				// Check MIME Type
				if (_.include(allowed_file_types, file.type)) {
					// Save the file
					new File({
						owner: owner._id,
						name: file.name,
						type: file.type,
						size: file.size
					}).save(function(err, savedFile) {
						// Let's move the upload now
						// TODO: We shouldn't be hardcoding the paths
						moveUpload(file.path, 'uploads/' + savedFile._id, function () {
							// Let the clients know about the new file
							self.chatServer.sendFile({
								url: '/files/' + savedFile._id + '/' + encodeURIComponent(savedFile.name),
								id: savedFile._id,
								name: savedFile.name,
								type: savedFile.type,
								size: savedFile.size,
								uploaded: savedFile.uploaded
							});
							res.send({
								status: 'success',
								message: 'File has been saved!'
							});
						});
					});
				} else {
					res.send({
						status: 'error',
						message: 'The MIME type ' + file.type + ' is not allowed'
					});
				}
			});
		});
	});

	// View files
	self.app.get('/files/:id/:name', function (req, res) {
		File.findById(req.params.id, function (err, file) {
			res.contentType(file.type);
			res.sendfile('uploads/' + file._id);
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

		return this;

    };

};

module.exports = Server;