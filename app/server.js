//
// Let's Chat Frontend
//

var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var http = require('http');
var https = require('https');
var express = require('express');
var expressNamespace = require('express-namespace');
var mongoose = require('mongoose');
var mongoStore = require('connect-mongo')(express);
var swig = require('swig');
var cons = require('consolidate');
var hash = require('node_hash');
var moment = require('moment');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var knox = require('knox');

// App stuff
var ChatServer = require('./chat.js');

// Models
var models = require('./models/models.js');

// TODO: We should require login on all routes
var requireLogin = function(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/login?next=' + req.path);
    }
};

//
// Web
//
var Server = function(config) {

    var self = this;

    self.config = config;

    // Mongo URL
    self.mongoURL = 'mongodb://'
        + self.config.db_user
        + ':' + self.config.db_password
        + '@' + self.config.db_host 
        + ':' + self.config.db_port 
        + '/' + self.config.db_name;

    // Create express app
    self.app = express();

    //
    // Configuration
    //
    self.app.configure(function() {

        // Body
        self.app.use(express.bodyParser());

        // Sessions
        self.sessionStore = new mongoStore({
            url: self.mongoURL
        });
        self.app.use(express.cookieParser());
        self.app.use(express.session({
            key: 'express.sid',
            cookie: {
                httpOnly: false // We have to turn off httpOnly for websockets
            }, 
            secret: self.config.cookie_secret,
            store: self.sessionStore
        }));

        // Auth
        self.app.use(passport.initialize());
        self.app.use(passport.session());

        // Templates
        swig.init({
            cache: !self.config.debug,
            root: 'templates',
            allowErrors: self.config.debug
        });
        self.app.engine('.html', cons.swig);
        self.app.set('view engine', 'html');
        self.app.set('views', 'templates');

        // Static
        self.app.use('/media', express.static(path.resolve('media')));

        // Router
        self.app.use(self.app.router);

    });

    // Authentication
    passport.use(new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password'
        },
        function(email, password, done) {
            models.user.findOne({
                'email': email
            }).exec(function(err, user) {
                if (err) {
                    return done(null, false,  { message: 'Some fields did not validate.' });
                }
                var hashedPassword = hash.sha256(password, self.config.password_salt)
                if (user && hashedPassword === user.password) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Incorrect password.' });
                }
            });
        }
    ));
    passport.serializeUser(function(user, done) {
        done(null, user._id);
    });
    passport.deserializeUser(function(id, done) {
        models.user.findOne({
            _id: id 
        }).exec(function(err, user) {
            done(err, user);
        });
    });

    //
    // Chat
    //
    self.app.get('/', requireLogin, function(req, res) {
        var user = req.user;
        var vars = {
            media_url: self.config.media_url,
            host: self.config.hostname,
            port: self.config.port,
            user_id: user._id,
            user_email: user.email,
            user_avatar: hash.md5(user.email),
            user_displayname: user.displayName,
            user_lastname: user.lastName,
            user_firstname: user.firstName,
            user_status: user.status
        }
        res.render('chat.html', vars);
    });

    //
    // Login
    //
    self.app.get('/login', function(req, res) {
        var image = _.chain(fs.readdirSync(path.resolve('media/img/photos'))).filter(function(file){
                return /\.(gif|jpg|jpeg|tiff|png)$/i.test(file);
            }).sample().value();
        res.render('login.html', {
            media_url: self.config.media_url,
            next: req.param('next', ''),
            disableRegistration: self.config.disable_registration,
            photo: image
        });;
    });

    //
    // Logout
    //
    self.app.all('/logout', function(req, res) {
        req.logout();
        req.session.destroy();
        res.redirect('/');
    });

    //
    // Serve Plugins
    //
    self.app.namespace('/plugins', function() {
        if (self.config.plugins) {
            _.each(self.config.plugins, function(plugin) {
                self.app.get('/' + plugin.url, function(req, res) {
                    res.json(require('../' + self.config.plugins_dir + '/' + plugin.file));
                });
            });
        }
    });

    //
    // Ajax
    //
    self.app.namespace('/ajax', function() {
        //
        // Login
        //
        self.app.post('/login', function(req, res) {
            passport.authenticate('local', function(err, user, info) {
                if (err) {
                    res.send({
                        status: 'error',
                        message: 'Some fields did not validate',
                        errors: err
                    });
                    return;
                }
                if (!user) {
                    res.send({
                        status: 'error',
                        message: 'Incorrect login credentials.'
                    });
                    return;
                }
                req.login(user, function(err) {
                    if (err) {
                        res.send({
                            status: 'error',
                            message: 'There were problems logging you in.'
                        });
                        return;
                    }
                    res.send({
                        status: 'success',
                        message: 'Logging you in...'
                    });
                });
            })(req, res);
        });
        //
        // Register
        //
        self.app.post('/register', function(req, res) {
            if (self.config.disable_registration) {
                // Registration is not enabled bro
                res.send(403, {
                    status: 'error',
                    message: 'Registration is disabled.'
                });
                return;
            }
            var form = req.body;
            models.user.findOne({ 'email': form.email }).exec(function(error, user) {
                // Check if a user with this email exists
                if (user) {
                    res.send({
                        status: 'error',
                        message: 'That email is already in use.'
                    });
                    return;
                }
                // We're good, lets save!
                var user = new models.user({
                    email: form.email,
                    password: form.password,
                    firstName: form['first-name'],
                    lastName: form['last-name'],
                    displayName: form['first-name'] + ' ' + form['last-name']
                }).save(function(err, user) {
                    if (err) {
                        res.send({
                            status: 'error',
                            message: 'Some fields did not validate',
                            errors: err
                        });
                        return;
                    }
                    req.login(user, function(err) {
                        if (err) {
                            res.send({
                                status: 'error',
                                message: 'There were problems logging you in.'
                            });
                            return;
                        }
                        res.send({
                            status: 'success',
                            message: 'You\'ve been successfully registered.'
                        });
                    });
                });
            });
        });
        //
        // Edit Profile
        //
        self.app.post('/profile', function(req, res) {
            var form = req.body;
            var profile = models.user.findOne({
                _id: req.user._id
            }).exec(function(err, user) {
                if (err) {
                    // Well shit
                    res.send({
                        status: 'error',
                        message: 'Unable to update your profile.'
                    });
                    return;
                }
                // Only grab the fields we need
                _.each({
                    displayName: form['display-name'],
                    firstName: form['first-name'],
                    lastName: form['last-name']
                }, function(value,  field) {
                    if (value && value.length > 0) {
                        user[field] = value;
                    }
                });
                user.status = form['status'];
                user.save(function(err) {
                    if (err) {
                        res.send({
                            status: 'error',
                            message: 'Some fields did not validate',
                            errors: err
                        });
                        return;
                    }
                    // Let the socket clients know
                    self.chatServer.updateUser(user);
                    // Aww yea
                    res.send({
                        status: 'success',
                        message: 'Your profile has been saved.'
                    });
                });
            });
        });
        //
        // Account Settings
        //
        self.app.post('/account', requireLogin, function(req, res) {
            var form = req.body;
            var profile = models.user.findOne({
                _id: req.user._id
            }).exec(function(err, user) {
                if (err) {
                    res.send({
                        status: 'error',
                        message: 'Unable to update your account.'
                    });
                    return;
                }
                // Is the password good?
                if (hash.sha256(form.password, self.config.password_salt) !== user.password) {
                    res.send({
                        status: 'error',
                        message: 'Incorrect password.'
                    });
                    return;
                }
                // Do we have a new email?
                if (form.email.length > 0) {
                    user.email = form.email;
                }
                // How about a new password?
                if (form['new-password'].length > 0) {
                    user.password = form['new-password'];
                }
                user.save(function(err) {
                    if (err) {
                        res.send({
                            status: 'error',
                            message: 'Some fields did not validate',
                            errors: err
                        });
                        return;
                    }
                    res.send({
                        status: 'success',
                        message: 'Your account has been updated.'
                    });
                });
            });
        });
        //
        // File uploadin'
        // TODO: Some proper error handling
        self.app.post('/upload-file', requireLogin, function(req, res) {
            var moveUpload = function(path, newPath, callback) {
                fs.readFile(path, function(err, data) {
                    fs.writeFile(newPath, data, function(err) {
                        callback();
                    });
                });
            }
            // Loops through them files
            _.each(req.files, function(file) {
                var roomID = req.body.room;
                var file = file[0];
                var owner = req.user;
                var allowed_file_types = self.config.allowed_file_types;
                // Lets see if this room exists
                models.room.findOne({
                    '_id': roomID
                }).exec(function(err, room) {
                    if (err) {
                        // Danger zone!
                        res.send({
                            status: 'error',
                            message: 'Couldn\'t do the db query'
                        });
                        return;
                    }
                    // No such room?
                    if (!room) {
                        res.send({
                            status: 'error',
                            message: 'This room does not exist'
                        });
                        return;
                    }
                    // Check MIME Type
                    if (_.include(allowed_file_types, file.type)) {
                        // Save the file
                        if (!self.config.s3) {

                            new models.file({
                                owner: owner._id,
                                name: file.name,
                                type: file.type,
                                size: file.size,
                                room: room._id
                            }).save(function(err, savedFile) {
                                // Let's move the upload now
                                moveUpload(file.path, self.config.uploads_dir + '/' + savedFile._id, function(err) {
                                    // Let the clients know about the new file
                                    var url = '/files/' + savedFile._id + '/' + encodeURIComponent(savedFile.name);
                                    self.chatServer.sendFile({
                                        url: url,
                                        id: savedFile._id,
                                        name: savedFile.name,
                                        type: savedFile.type,
                                        size: Math.floor(savedFile.size / 1024),
                                        uploaded: savedFile.uploaded,
                                        owner: owner.displayName,
                                        room: room._id
                                    });
                                    res.send({
                                        status: 'success',
                                        message: file.name + ' has been saved!',
                                        path: url
                                    });
                                });
                            });        

                        } else {
                            var client = knox.createClient({
                                key: self.config.s3.accessKeyId,
                                secret: self.config.s3.secretAccessKey,
                                region: self.config.s3.region,
                                bucket: self.config.s3.bucket
                            });
                            date = new Date()
                            newFilename = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate() + '-' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + '-' + file.name
                            client.putFile(file.path, '/' + newFilename, {'Content-Type': file.type, 'Content-Length': file.size}, function (err, response) {
                                if (response.statusCode == 200) {
                                    new models.file({
                                        owner: owner._id,
                                        name: file.name,
                                        type: file.type,
                                        size: file.size,
                                        room: room._id,
                                        url: 'https://s3-' + self.config.s3.region + '.amazonaws.com/' + self.config.s3.bucket + '/' + encodeURIComponent(newFilename)
                                    }).save(function(err, savedFile) {
                                        self.chatServer.sendFile({
                                            url: savedFile.url,
                                            id: savedFile._id,
                                            name: savedFile.name,
                                            type: savedFile.type,
                                            size: Math.floor(savedFile.size / 1024),
                                            uploaded: savedFile.uploaded,
                                            owner: owner.displayName,
                                            room: room._id
                                        });

                                        res.send({
                                            status: 'success',
                                            message: file.name + ' has been saved!',
                                            url: savedFile.url
                                        });                                        

                                    });
                                } else {
                                    res.send({
                                        status: 'error',
                                        message: 'There was a problem with the S3 credentials.'
                                    });
                                }
                            });                    
                        }

                    } else {
                        res.send({
                            status: 'error',
                            message: 'The MIME type ' + file.type + ' is not allowed'
                        });
                    }
                });
            });
        });
    });

    //
    // View files
    //
    self.app.get('/files/:id/:name', requireLogin, function(req, res) {
        models.file.findById(req.params.id, function(err, file) {
            if (err) {
                // Error
                res.send(500, 'Something went terribly wrong');
                return;
            }
            res.contentType(file.type);
            res.sendfile(self.config.uploads_dir + '/' + file._id);
        });
    });

    //
    // Transcripts
    //
    self.app.get('/transcripts/:room', requireLogin, function(req, res) {
        var fromDate = moment().subtract('days', 1).format("DDMMYYYY");
        var toDate = moment().format("DDMMYYYY");

        res.writeHead(301, {Location: '/transcripts/' + req.params.room + '/from/' + fromDate + '/to/' + toDate});
        res.end();
    });

    self.app.get('/transcripts/:room/from/:fromDate/to/:toDate', requireLogin, function(req, res) {
        //dates in url are in DDMMYYY format
        var dateParamPattern = /[0-9]{6}/;

        //check if dates in the parameters are 6 digit numbers
        if(!dateParamPattern.test(req.params.fromDate) ||
           !dateParamPattern.test(req.params.toDate)) {
           res.send(400, 'Invalid parameters');
        }

        var fromDate = moment(req.params.fromDate, "DDMMYYYY");
        var toDate = moment(req.params.toDate, "DDMMYYYY");

        // Lookup room
        models.room.findById(req.params.room, function(err, room) {
            if (err || !room) {
                // Error
                res.send(500, 'Something went wrong trying to lookup the room');
                return;
            }
            // Lookup messages
            // TODO: Maybe we should push message refs to room so we can use populate :|
            models.message.find({
                room: room._id
            }).select('-room -__v')
            .populate('owner')
            .where('posted').gt(fromDate).lt(moment(new Date(toDate)).add('d', 1))
            .exec(function(err, docs) {
                if (err) {
                    // Whoopsie
                    return;
                }
                var user = req.user;
                // Let's process some messages
                var messages = [];
                docs.forEach(function (message) {
                    messages.push({
                        id: message._id,
                        owner: message.owner._id,
                        avatar: hash.md5(message.owner.email),
                        name: message.owner.displayName,
                        text: message.text,
                        posted: message.posted,
                        time: moment(message.posted).format('hh:mm DD-MM-YYYY')
                    });
                });
                res.render('transcript.html', {
                    media_url: self.config.media_url,
                    fromDate: moment(fromDate).format('dddd, MMM Do YYYY'),
                    toDate: moment(toDate).format('dddd, MMM Do YYYY'),
                    room: {
                        id: room._id,
                        name: room.name,
                        description: room.description
                    },
                    messages: messages,
                    user: {
                        id: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        displayName: user.displayName,
                        avatar: hash.md5(user.email),
                        safeName: user.displayName.replace(/\W/g, '')
                    }
                });
            });
        });
    });

    //
    // Start
    //
    self.start = function() {
        // Connect to mongo and start listening
        mongoose.connect(self.mongoURL, function(err) {
            if (err) throw err;
            // Go go go!
            if (!self.config.https) {
                // Create regular HTTP server
                self.server = http.createServer(self.app)
                  .listen(self.config.port, self.config.host);
            } else {
                // Setup HTTP -> HTTP redirect server
                var redirectServer = express();
                redirectServer.get('*', function(req, res){
                    res.redirect('https://' + req.host + ':' + self.config.https.port + req.path)
                })
                http.createServer(redirectServer)
                  .listen(self.config.port, self.config.host);
                // Create HTTPS server
                self.server = https.createServer({
                    key: fs.readFileSync(self.config.https.key),
                    cert: fs.readFileSync(self.config.https.cert)
                }, self.app).listen(self.config.https.port);
            }
            self.chatServer = new ChatServer(config, self.server, self.sessionStore).start();
        });
        return this;
    };

};

module.exports = Server;
