//
// Let's Chat
//

var _ = require('underscore'),
    express = require('express.io'),
    expressMiddleware = require('express.io-middleware'),
    nunjucks = require('nunjucks'),
    mongoose = require('mongoose'),
    MongoStore = require('connect-mongo')(express);

var models = require('./app/models'),
    middlewares = require('./app/middlewares'),
    controllers = require('./app/controllers');

var settings = require('./settings.js');

var app = express().http().io();
expressMiddleware(app);

// Session
app.use(express.cookieParser());
app.use(express.session({
    secret: settings.cookieSecret,
    store: new MongoStore({
      url: settings.mongoURI,
      auto_reconnect: true
    })
}));

// Populate user for each request
app.use(middlewares.populateUser);
app.io.use(middlewares.populateUser);

// Public
app.use('/media', express.static(__dirname + '/media'));

// Templates
nunjucks.configure('templates', {
    autoescape: true,
    express: app
});

// HTTP Middlewares
app.use(express.json());
app.use(express.urlencoded());

//
// Routes
//

app.get('/', middlewares.requireLogin, function(req, res) {
	res.render('chat.html', {
        account: req.user.toJSON()
    });
});

app.get('/login', function(req, res) {
	res.render('login.html');
});

app.post('/account/login', function(req, res) {
    req.io.route('users:login');
});

// TODO: you should be POST'ing to DELETE'ing this resource
app.get('/account/logout', function(req, res) {
    req.io.route('users:logout');
});

app.post('/account/register', function(req, res) {
    req.io.route('users:create');
});

app.get('/rooms', middlewares.requireLogin, function(req, res) {
    req.io.route('rooms:list');
});

app.post('/rooms', middlewares.requireLogin, function(req, res) {
    req.io.route('rooms:create');
});

app.get('/messages', middlewares.requireLogin, function(req, res) {
    req.io.route('messages:list');
});

app.post('/messages', middlewares.requireLogin, function(req, res) {
    req.io.route('messages:create');
});

app.get('/users', middlewares.requireLogin, function(req, res) {
    req.io.route('users:list');
});

app.get('/users/:email', middlewares.requireLogin, function(req, res) {
    req.io.route('users:retrieve');
});

app.post('/users/:email', middlewares.requireLogin, function(req, res) {
    req.io.route('users:update');
});

//
// Sockets
//

var authorizationIO = app.io.get('authorization');
app.io.set('authorization', function(data,accept) {
    authorizationIO(data, function(err, res){
        if (data.session && data.session.userID) {
            accept(null, true);
            return;
        }
        accept(null, false);
    });
});

app.io.route('users', {
    create: function(req) {
        var fields = req.body || req.data;
        models.user.create({
            email: fields.email,
            password: fields.password,
            firstName: fields.firstName || fields.firstname || fields['first-name'],
            lastName: fields.lastName || fields.lastname || fields['last-name'],
            displayName: fields.displayName || fields.displayname || fields['display-name']
        }, function(err, user) {
            // Did we get error?
            if (err) {
                // console.error(err);
                var message = 'Sorry, we could not process your request';
                // User already exists
                if (err.code == 11000) {
                    message = 'Email has already been taken';
                }
                // Invalid username
                if (err.errors) {
                    message = _.map(err.errors, function(error) {
                        return error.message;
                    }).join(' ');
                }
                // Notify
                req.io.respond({
                    status: 'error',
                    message: message
                }, 400);
                return;
            }
            // AWWW YISSSSS!
            req.io.respond({
                status: 'success',
                message: 'You\'ve been registered, please try logging in now!'
            }, 201);
        });
    },
    login: function(req) {
        var fields = req.body || req.data;
        models.user.authenticate(fields.email, fields.password, function(err, user) {
            if (err) {
                // Something bad
                req.io.respond({
                    status: 'error',
                    message: 'An error occured while trying to log you in'
                }, 400);
                return;
            }
            if (user && user) {
                // Hello user <3
                req.session.userID = user._id;
                req.session.save(function() {
                    req.io.respond({
                        status: 'success',
                        message: 'You\'ve been logged in!'
                    });
                });
                return;
            }
            // NOPE!
            req.io.respond({
                status: 'error',
                message: 'Could not log you in'
            }, 401);
        });
    },
    logout: function(req) {
        req.session.destroy();
        req.io.respond({
            status: 'succcess',
            message: 'Session deleted'
        }, 200);
    },
    list: function(req) {
        models.user
              .find()
              .sort({'email': 1})
              .exec(function(err, users) {
            // return all the users in the system
            if (err) {
                // TODO: can you create a default error handler? We have code like
                //       this all over the place.
                console.error(err);
                req.io.respond(err, 400);
                return;
            }
            req.io.respond(users);
        });
    },
    retrieve: function(req) {
        var email = req.params.email;
        models.user.find({email: email}).exec(function (err, user) {
            if (err) {
                console.error(err);
                req.io.respond(err, 400);
                return;
            }
            console.log(user);
            req.io.respond(user);
        });
    },
    update: function(req) {
        // Update profile and stuff
    }
});

app.io.route('messages', {
    create: function(req) {
        var data = req.data || req.body;
        models.message.create({
            owner: req.user._id,
            text: data.text
        }, function(err, message) {
            if (err) {
                console.error(err);
                req.io.respond(err, 400);
                return;

            }
            req.io.respond(message, 201);
            app.io.broadcast('messages:new', message);
        });
    },
    list: function(req) {
        models.message
            .find()
            .limit(20)
            .sort({ 'posted': -1 })
            .exec(function(err, messages) {
            if (err) {
                console.error(err);
                req.io.respond(err, 400);
                return;
            }
            req.io.respond(messages.reverse());
        });
    }
});

app.io.route('rooms', {
    create: function(req) {
        var data = req.data || req.body;
        models.room.create({
            owner: req.user._id,
            name: data.name,
            description: data.description
        }, function(err, room) {
            if (err) {
                console.error(err);
                req.io.respond(err, 400);
                return;
            }
            req.io.respond(room, 201);
            app.io.broadcast('rooms:new', room);
        });
    },
    list: function(req) {
        models.room
            .find()
            .exec(function(err, rooms) {
            if (err) {
                console.error(err);
                req.io.respond(err, 400);
                return;
            }
            req.io.respond(rooms);
        });
    },
    join: function(req) {
        var id = req.data;
        req.io.join(id);
        console.log(id);
        models.room.findById(id, function(err, room) {
            if (err) {
                console.error(err);
                return;
            }
            if (!room) {
                console.error('No room!');
                req.io.respond();
                return;
            }
            req.io.respond(room.toJSON());
        });
    }
});

//
// Mongo
//

// TODO: Add keep-alive
mongoose.connect(settings.mongoURI);

mongoose.connection.on('error', function (err) {
    if (err)
        console.warn(err);
});

mongoose.connection.on('disconnected', function() {
    mongoose.connect(settings.mongoURI);
});

//
// Go Time
//

app.listen(settings.port || 5000);
