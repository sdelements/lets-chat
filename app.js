//
// LCPIZZA
//

var _ = require('underscore'),
    express = require('express.io'),
    nunjucks = require('nunjucks'),
    mongoose = require('mongoose'),
    MongoStore = require('connect-mongo')(express);

var models = require('./app/models');

var settings = require('./settings.js');

var app = express().http().io();

// Session
app.use(express.cookieParser());
app.use(express.session({
    secret: settings.cookieSecret,
    store: new MongoStore({
      url: settings.mongoURI,
      auto_reconnect: true
    })
}));

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

app.get('/', function(req, res) {
	res.render('chat.html', {
		account: req.session.username || false
	});
});

app.post('/users/register', function(req, res) {
    req.io.route('users:create');
});

app.get('/messages', function(req, res) {
    req.io.route('messages:list');
});

app.post('/messages', function(req, res) {
    req.io.route('messages:create');
});

//
// Sockets
//

app.io.route('users', {
    create: function(req, res) {
        var fields = req.body || req.data;
        models.user.create({
            email: fields.email,
            password: fields.password,
            firstName: fields.firstName || fields['first-name'],
            lastName: fields.lastName || fields['last-name'],
            displayName: fields.displayName || fields['display-name']
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
                        return error.message
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
                message: 'You\'ve been registered, please try logging in now!',
                reset: true
            }, 201);
        });
    },
    update: function(req, res) {
        console.log('update')
    },
    get: function(req, res) {
        console.log('get')
    },
    list: function(req, res) {
        console.log('list')
    }
});

app.io.route('messages', {
    create: function(req, res) {
        var data = req.data || req.body;
        console.log(data)
        models.message.create({
            text: data.text
        }, function(err, message) {
            if (err) {
                console.error(err);
                req.io.respond(err, 400)
                return;
            }
            req.io.respond(null, 201)
            req.io.broadcast('messages:new', data)
        });
    },
    get: function(req, res) {
        console.log('get')
    },
    list: function(req, res) {
        console.log('list')
        models.message.find(function(err, messages) {
            if (err) {
                console.error(err);
                req.io.respond(err, 400)
                return;
            }
            req.io.respond(messages)
            // req.io.respond(null, messages, 201)
        })
    }
})

app.io.route('rooms', {
    join: function(req) {
        var id = req.data;
        req.io.join(id);
    }
});

//
// Mongo
//

// TODO: Add keep-alive
mongoose.connect(settings.mongoURI);

mongoose.connection.on('error', function (err) {
    if (err)
        console.warn(err)
});

mongoose.connection.on('disconnected', function() {
    mongoose.connect(settings.mongoURI);
});

//
// Go Time
//

app.listen(settings.port || 5000);