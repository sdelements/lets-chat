//
// Let's Chat
//

'use strict';

var servers_count;
var bCluster = 1;

var settings = require('./app/config');

if(settings.cluster_regime !== undefined) {
  servers_count = settings.cluster_regime.servers_count;
}

if(servers_count === undefined || servers_count === null || servers_count === 0) {
  bCluster = 0;
  servers_count = 1;
}

function startCluster(servers_count) {
  const cluster = require('cluster');
  if (cluster.isMaster) {
    if(servers_count == -1) {
      servers_count = require('os').cpus().length;
    }

    console.log('Setting up cluster with 1 Master and ' + servers_count + ' workers..');

    for (var i=0; i < servers_count; i++) {
      cluster.fork();
    }

    cluster.on('online', function(worker) {
      console.log('Worker:' + worker.process.pid + ' is online');
    });

    cluster.on('exit', function(worker, code, signal) {
      console.log('Worker:' + worker.process.pid + ' exited');
      cluster.fork(); /* Restart a new worker */
    });
  } else {
    startSingleNodeInstance();
  }
}  

function startSingleNodeInstance() {

process.title = 'letschat';

require('colors');

var _ = require('lodash'),
    path = require('path'),
    fs = require('fs'),
    express = require('express.oi'),
    i18n = require('i18n'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    compression = require('compression'),
    helmet = require('helmet'),
    http = require('http'),
    nunjucks = require('nunjucks'),
    mongoose = require('mongoose'),
    connectMongo = require('connect-mongo/es5'),
    all = require('require-tree'),
    psjon = require('./package.json'),
    auth = require('./app/auth/index'),
    core = require('./app/core/index');

var MongoStore = connectMongo(express.session),
    httpEnabled = settings.http && settings.http.enable,
    httpsEnabled = settings.https && settings.https.enable,
    models = all(path.resolve('./app/models')),
    middlewares = all(path.resolve('./app/middlewares')),
    controllers = all(path.resolve('./app/controllers')),
    app;

//
// express.oi Setup
//
if (httpsEnabled) {
     app = express().https({
        key: fs.readFileSync(settings.https.key),
        cert: fs.readFileSync(settings.https.cert),
        passphrase: settings.https.passphrase
    }).io();
} else {
    app = express().http().io();
}

if (settings.env === 'production') {
    app.set('env', settings.env);
    app.set('json spaces', undefined);
    app.enable('view cache');
}

// Session
var sessionStore = new MongoStore({
    url: settings.database.uri,
    autoReconnect: true
});

// Session
var session = {
    key: 'connect.sid',
    secret: settings.secrets.cookie,
    store: sessionStore,
    cookie: { secure: httpsEnabled },
    resave: false,
    saveUninitialized: true
};

app.get('/myroom', function(req, res) {
  var  Room = require('./app/models/room');
  Room.find({}, function( err, data) {
    if(err) {
      console.log(err);
      res.json({'status': 'Could not delete all messages. Do it manually'});
      return;
    }
      res.json({'rooms': data});
      return;
  });
});

//Delete
app.get('/deleteall', function(req, res) {
  console.log('Deleting stale data from last run');
  var  Message = require('./app/models/message');
  var  Room = require('./app/models/room');
  Message.remove({}, function(err) {
    if (err) {
	  res.json({'status': 'Could not delete all messages. Do it manually'});
	  return;
	}
    Room.remove({}, function(err) {
      if (err) {
	    res.json({'status': 'Could not delete all the rooms. Do it manually'});
	    return;
	  }
    });

    res.status(200);
	res.json({'status': 'all clear'});
  });
});

// Set compression before any routes
app.use(compression({ threshold: 512 }));

app.use(cookieParser());
app.io.session(session);

auth.setup(app, session, core);

// Security protections
app.use(helmet.frameguard());
app.use(helmet.hidePoweredBy());
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.hsts({
    maxAge: 31536000,
    includeSubdomains: true,
    force: httpsEnabled,
    preload: true
}));
app.use(helmet.contentSecurityPolicy({
    defaultSrc: ['\'none\''],
    connectSrc: ['*'],
    scriptSrc: ['\'self\'', '\'unsafe-eval\''],
    styleSrc: ['\'self\'', 'fonts.googleapis.com', '\'unsafe-inline\''],
    fontSrc: ['\'self\'', 'fonts.gstatic.com'],
    mediaSrc: ['\'self\''],
    objectSrc: ['\'self\''],
    imgSrc: ['* data:']
}));

var bundles = {};
app.use(require('connect-assets')({
    paths: [
        'media/js',
        'media/less'
    ],
    helperContext: bundles,
    build: settings.env === 'production',
    fingerprinting: settings.env === 'production',
    servePath: 'media/dist'
}));

// Public
app.use('/media', express.static(__dirname + '/media', {
    maxAge: '364d'
}));

// Stop
app.get('/stopserver', function(req, res) {
  console.log('Got the SIGINT signal. Dumping memory usage stat.');
  var after_memusage = process.memoryUsage();
  setTimeout(print_stats, 250);
  function print_stats() {
    console.log('Memory usage is: ');
    ['rss', 'heapTotal', 'heapUsed'].forEach(function(key) {
      var a = after_memusage[key] / (1024 * 1024);
    console.log('%sM %s', a.toFixed(2), key);
  });
  
  console.log('Exiting ...');
  res.json({message: 'Server stopped'});
    server.close();
    process.exit(0);
 }
});

// Templates
var nun = nunjucks.configure('templates', {
    autoescape: true,
    express: app,
    tags: {
        blockStart: '<%',
        blockEnd: '%>',
        variableStart: '<$',
        variableEnd: '$>',
        commentStart: '<#',
        commentEnd: '#>'
    }
});

function wrapBundler(func) {
    // This method ensures all assets paths start with "./"
    // Making them relative, and not absolute
    return function() {
        return func.apply(func, arguments)
                   .replace(/href="\//g, 'href="./')
                   .replace(/src="\//g, 'src="./');
    };
}

nun.addFilter('js', wrapBundler(bundles.js));
nun.addFilter('css', wrapBundler(bundles.css));
nun.addGlobal('text_search', false);

// i18n
i18n.configure({
    directory: path.resolve(__dirname, './locales'),
    locales: settings.i18n.locales || settings.i18n.locale,
    defaultLocale: settings.i18n.locale
});
app.use(i18n.init);

// HTTP Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// IE header
app.use(function(req, res, next) {
    res.setHeader('X-UA-Compatible', 'IE=Edge,chrome=1');
    next();
});

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
    var port = httpsEnabled && settings.https.port ||
               httpEnabled && settings.http.port;

    var host = httpsEnabled && settings.https.host ||
               httpEnabled && settings.http.host || '0.0.0.0';



    if (httpsEnabled && httpEnabled) {
        // Create an HTTP -> HTTPS redirect server
        var redirectServer = express();
        redirectServer.get('*', function(req, res) {
            var urlPort = port === 80 ? '' : ':' + port;
            res.redirect('https://' + req.hostname + urlPort + req.path);
        });
        http.createServer(redirectServer)
            .listen(settings.http.port || 5000, host);
    }

    app.listen(port, host);

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

function checkForMongoTextSearch() {
    if (!mongoose.mongo || !mongoose.mongo.Admin) {
        // MongoDB API has changed, assume text search is enabled
        nun.addGlobal('text_search', true);
        return;
    }

    var admin = new mongoose.mongo.Admin(mongoose.connection.db);
    admin.buildInfo(function (err, info) {
        if (err || !info) {
            return;
        }

        var version = info.version.split('.');
        if (version.length < 2) {
            return;
        }

        if(version[0] < 2) {
            return;
        }

        if(version[0] === '2' && version[1] < 6) {
            return;
        }

        nun.addGlobal('text_search', true);
    });
}

mongoose.connect(settings.database.uri, function(err) {
    if (err) {
        throw err;
    }

    checkForMongoTextSearch();
    startApp();
});

}

if(bCluster === 1) {
  startCluster(servers_count); 
} else {
  console.log('Starting a single instance of Node.js process with (pid: ' + process.pid + ')');
  startSingleNodeInstance();
}

