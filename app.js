//
// Let's Chat
//

'use strict';

var _ = require('lodash'),
    fs = require('fs'),
    colors = require('colors'),
    express = require('express.io'),
    expressMiddleware = require('express.io-middleware'),
    nunjucks = require('nunjucks'),
    mongoose = require('mongoose'),
    MongoStore = require('connect-mongo')(express),
    all = require('require-tree');

var psjon = require('./package.json'),
    settings = require('./app/config.js');

var models = all('./app/models'),
    middlewares = all('./app/middlewares'),
    controllers = all('./app/controllers'),
    core = require('./app/core/index');

//
// Express.io Setup
//
var app = express().http().io();
expressMiddleware(app);

// Session
app.use(express.cookieParser());
app.use(express.session({
    secret: settings.secrets.cookie,
    store: new MongoStore({
      url: settings.database.uri,
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
        core: core,
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

app.io.set('authorization', function(data, accept) {
    authorizationIO(data, function(err, res) {
        if (err) {
            console.error('Error authorizing socket');
            console.error(err);
        }
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
mongoose.connect(settings.database.uri);

mongoose.connection.on('error', function (err) {
    if (err) {
        console.warn(err);
    }
});

mongoose.connection.on('disconnected', function() {
    throw new Error('Could not connect to database');
});

//
// Go Time
//
app.listen(settings.server.port || 5000);

if (settings.xmpp.enable) {
    var xmpp = require('./app/xmpp/index');
    xmpp(core);
}

var art = fs.readFileSync('./app/misc/art.txt', 'utf8');
console.log('\n' + art + '\n\n' + 'Release ' + psjon.version.yellow + '\n');
