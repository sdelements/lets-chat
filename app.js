'use strict';

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
    MongoStore = require('connect-mongo'),
    all = require('require-tree'),
    psjon = require('./package.json'),
    settings = require('./app/config'),
    auth = require('./app/auth/index'),
    core = require('./app/core/index');

const httpEnabled = settings.http?.enable;
const httpsEnabled = settings.https?.enable;
const models = all(path.resolve('./app/models'));
const middlewares = all(path.resolve('./app/middlewares'));
const controllers = all(path.resolve('./app/controllers'));

let app;

// Express.io Setup
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

// Session Store (Updated for MongoDB v8)
const sessionStore = MongoStore.create({
    mongoUrl: settings.database.uri,
    autoReconnect: true
});

// Session Configuration
const session = {
    key: 'connect.sid',
    secret: settings.secrets.cookie,
    store: sessionStore,
    cookie: { secure: httpsEnabled },
    resave: false,
    saveUninitialized: true
};

// Middleware
app.use(compression({ threshold: 512 }));
app.use(cookieParser());
app.io.session(session);
auth.setup(app, session, core);

// Security Headers
app.use(helmet({
    frameguard: true,
    hidePoweredBy: true,
    ieNoOpen: true,
    noSniff: true,
    xssFilter: true,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        force: httpsEnabled,
        preload: true
    },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'none'"],
            connectSrc: ["*"],
            scriptSrc: ["'self'", "'unsafe-eval'"],
            styleSrc: ["'self'", "fonts.googleapis.com", "'unsafe-inline'"],
            fontSrc: ["'self'", "fonts.gstatic.com"],
            mediaSrc: ["'self'"],
            objectSrc: ["'self'"],
            imgSrc: ["* data:"]
        }
    }
}));

// Asset Bundling
const bundles = {};
app.use(require('connect-assets')({
    paths: ['media/js', 'media/less'],
    helperContext: bundles,
    build: settings.env === 'production',
    fingerprinting: settings.env === 'production',
    servePath: 'media/dist'
}));

// Static Files
app.use('/media', express.static(path.join(__dirname, 'media'), { maxAge: '364d' }));

// Template Engine Setup
const nun = nunjucks.configure('templates', {
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
    return function () {
        return func.apply(func, arguments)
            .replace(/href="\//g, 'href="./')
            .replace(/src="\//g, 'src="./');
    };
}

nun.addFilter('js', wrapBundler(bundles.js));
nun.addFilter('css', wrapBundler(bundles.css));
nun.addGlobal('text_search', false);

// i18n Configuration
i18n.configure({
    directory: path.resolve(__dirname, './locales'),
    locales: settings.i18n.locales || settings.i18n.locale,
    defaultLocale: settings.i18n.locale
});
app.use(i18n.init);

// HTTP Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// IE Header
app.use((req, res, next) => {
    res.setHeader('X-UA-Compatible', 'IE=Edge,chrome=1');
    next();
});

// Controllers
_.each(controllers, (controller) => {
    controller.apply({ app, core, settings, middlewares, models, controllers });
});

// MongoDB Connection with Mongoose v8
mongoose.connection.on('error', (err) => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
});

mongoose.connection.on('disconnected', () => {
    console.error('MongoDB Disconnected');
    process.exit(1);
});

// Start Application
async function startApp() {
    try {
        await mongoose.connect(settings.database.uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        nun.addGlobal('text_search', true);
        
        const port = httpsEnabled ? settings.https.port : settings.http.port;
        const host = httpsEnabled ? settings.https.host : settings.http.host || '0.0.0.0';

        if (httpsEnabled && httpEnabled) {
            const redirectServer = express();
            redirectServer.get('*', (req, res) => {
                const urlPort = port === 80 ? '' : `:${port}`;
                res.redirect(`https://${req.hostname}${urlPort}${req.path}`);
            });
            http.createServer(redirectServer).listen(settings.http.port || 5000, host);
        }

        app.listen(port, host, () => {
            console.log(`Server is running on ${httpsEnabled ? 'https' : 'http'}://${host}:${port}`);
        });

        if (settings.xmpp?.enable) {
            const xmpp = require('./app/xmpp/index');
            xmpp(core);
        }

        const art = fs.readFileSync('./app/misc/art.txt', 'utf8');
        console.log('\n' + art + '\n\n' + `Release ${psjon.version.yellow}\n`);
    } catch (err) {
        console.error('Error starting app:', err);
        process.exit(1);
    }
}

startApp();
