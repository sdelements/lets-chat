//
// Let's Chat
//

'use strict';

var _ = require('lodash'),
    fs = require('fs'),
    colors = require('colors'),
    express = require('express.io'),
    expressMiddleware = require('express.io-middleware'),
    helmet = require('helmet'),
    http = require('http'),
    nunjucks = require('nunjucks'),
    mongoose = require('mongoose'),
    migroose = require('./migroose'),
    MongoStore = require('connect-mongo')(express),
    all = require('require-tree');

var psjon = require('./package.json'),
    settings = require('./app/config.js'),
    httpEnabled = settings.http && settings.http.enable,
    httpsEnabled = settings.https && settings.https.enable;

var auth = require('./app/auth/index'),
    models = all('./app/models'),
    middlewares = all('./app/middlewares'),
    controllers = all('./app/controllers'),
    core = require('./app/core/index'),
    app;

//
// Express.io Setup
//
if (httpsEnabled) {
     app = express().https({
        key: fs.readFileSync(settings.https.key),
        cert: fs.readFileSync(settings.https.cert)
    }).io();
} else {
    app = express().http().io();
}
expressMiddleware(app);

// Session
var sessionStore = new MongoStore({
    url: settings.database.uri,
    auto_reconnect: true
});

// Session
var session = {
    key: 'connect.sid',
    secret: settings.secrets.cookie,
    store: sessionStore,
    cookie: { secure: httpsEnabled }
};

app.use(express.cookieParser());
app.use(express.session(session));

auth.setup(app, session, core);

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

// Security protections
app.use(helmet.frameguard('sameorigin'));
app.use(helmet.hidePoweredBy());
app.use(helmet.hsts({
    maxAge: 31536000,  
    includeSubdomains: true, 
    force: httpsEnabled,
    preload: true
}));
app.use(helmet.noSniff());

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
// Mongo
//

mongoose.connection.on('error', function (err) {
    throw new Error(err);
});

mongoose.connection.on('disconnected', function() {
    throw new Error('Could not connect to database');
});

//
// Go Time
//

function startApp() {
    var port = settings.PORT ||
    httpsEnabled && settings.https.port ||
    httpEnabled && settings.http.port;

    if (httpsEnabled && httpEnabled) {
        // Create an HTTP -> HTTPS redirect server
        var redirectServer = express();
        redirectServer.get('*', function(req, res) {
            var urlPort = port === 80 ? '' : ':' + port;
            res.redirect('https://' + req.host + urlPort + req.path);
        });
        http.createServer(redirectServer).listen(settings.http.port || 5000);
    }

    app.listen(port);

    //
    // XMPP
    //
    if (settings.xmpp.enable) {
        var xmpp = require('./app/xmpp/index');
        xmpp(core);
    }

    var art = fs.readFileSync('./app/misc/art.txt', 'utf8');
    console.log('\n' + art + '\n\n' + 'Release ' + psjon.version.yellow + '\n');
}

mongoose.connect(settings.database.uri, function(err) {
    if (err) {
        throw err;
    }

    migroose.needsMigration(function(migrationRequired) {
        if (migrationRequired) {
            console.log('Database migration required'.red);
            console.log('Ensure you backup your database first.');
            console.log('');
            console.log(
                'Run the following command: ' + 'npm run-script migrate'.yellow
            );

            return process.exit();
        }

        startApp();
    });
});
