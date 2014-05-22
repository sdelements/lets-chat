//
// Let's Chat
//

var _ = require('underscore'),
    async = require('async'),
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
// Controllers
//

_.each(controllers, function(controller) {
    controller.apply({
        app: app,
        settings: settings,
        middlewares: middlewares,
        models: models,
        controllers: controllers
    });
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

//
// Mongo
//

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
