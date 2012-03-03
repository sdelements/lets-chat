var express = require('express')
var mustache = require('mustache')
var fs = require('fs')
var MemoryStore = express.session.MemoryStore
var User = require('./models/auth.js')
//var connect = require('connect')
var chatServer = require('./chatServer.js')

var config = require('./configuration.js')


var requireLogin = function (req, res, next) {
    if (req.session.user) {
        next()
    } else {
        res.redirect('/login?next=' + req.path)
    }
}


var Server = function (config) {
    
    var self = this
    this.config = config

    this.template = function (templateRoot) {
        var cache = {}
        return function (file) {
            if (cache[file]){
                return cache[file]
            } else {
                cache[file] = fs.readFileSync(templateRoot + file).toString()
                return cache[file]
            }
        }
    }(config.templateRoot)

    this.init = function() {

        var app = express.createServer()
        self.app = app
        var sessionStore = new MemoryStore()
        self.sessionStore = sessionStore
        app.use(express.bodyParser())
        app.use(express.cookieParser())
        app.use(express.session({
            key: 'express.sid',
            cookie: {httpOnly: false}, // We have to turn off httpOnly for websockets
            secret: "DerpDerpDerp",
            store: sessionStore
        }))

        app.get('/login', function (req, res) {
            cxt = {
                'site_title': "Let's Chat Bro",
                'media_url': config.media_url,
                'next': req.param('next', '') 
            }
            res.send(mustache.to_html(self.template('loginTemplate.html'), cxt))
        })

        app.post('/login', function (req, res) {
            var username = req.param('username')
            var password = req.param('password')
            var user = User.findOne({'username': username, 
                                     'password': password}
                    ).run(function (error, user) {
                        req.session.user = user
                        req.session.save()
                        res.redirect(req.param('next'))
            })
        })

        app.post('/register', function (req, res) {
            var user = new User({
            'username': req.param('username'), 
            'password': req.param('password'),
            'firstName': req.param('firstName'),
            'lastName': req.param('lastName'),
            'displayName': req.param('firstName')
            })
            req.session.user = user
            req.session.save()
            res.redirect(req.param('next'))
        })

        app.get('/', requireLogin, function (req, res) {
            cxt = {
               'host': self.config.hostname,
               'port': self.config.port,
               'media_url': self.config.media_url,
               'site_title': self.config.site_title,
               'page_title': "Development",
               'jsTemplates': self.template('jsTemplates.html')
                }
            res.send(mustache.to_html(self.template('chat.html'), cxt, {
                'header': self.template('header.html'),
                'footer': self.template('footer.html')
            }))
        })

    }

    this.start = function() {
        self.app.listen(config.port)
        self.chatServer = new chatServer(self.app, self.sessionStore)
    }

    this.init()
}

module.exports = Server
