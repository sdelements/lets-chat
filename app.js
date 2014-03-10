//
// LCPIZZA
//

var _ = require('underscore'),
    express = require('express.io'),
    nunjucks = require('nunjucks'),
    mongoose = require('mongoose'),
    MongoStore = require('connect-mongo')(express);

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

//
// Mongo
//

// TODO: Add keep-alive
mongoose.connect(settings.mongoURI);

mongoose.connection.on('error', function (err) {
    console.warn(err)
});

mongoose.connection.on('disconnected', function() {
    mongoose.connect(settings.mongoURI);
});

//
// Go Time
//

app.listen(settings.port || 5000);