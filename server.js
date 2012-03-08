var express = require('express')
var mustache = require('mustache')
var fs = require('fs')
var forms = require('forms')
var _ = require('underscore')
var MemoryStore = express.session.MemoryStore
var User = require('./models/auth.js')
//var connect = require('connect')
var chatServer = require('./chatServer.js')
var forms = require('./forms.js')
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

    this.init = function () {

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
        app.use(express.static(__dirname + '/media'))

        app.get('/login', function (req, res) {
            cxt = {
                'site_title': "Let's Chat Bro",
                'media_url': config.media_url,
                'next': req.param('next', '') 
            }
            res.send(mustache.to_html(self.template('loginTemplate.html'), cxt))
        })

        app.post('/login', function (req, res) {
            var form = forms.loginForm.bind(req.body)
            console.log(form.data.username + " " + form.data.password)
            var user = User.findOne({'username': form.data.username, 
                                     'password': form.data.password
                                    }).run(function (error, user) {
                if (user) {
                    req.session.user = user
                    req.session.save()
                    res.redirect(form.data.next)
                } else {
                    res.redirect('/login' + 
                        form.data.next ? '?next=' + form.data.next:'')
                }
            })
        })

        app.all('/logout', function (req, res) {
            req.session.destroy()
            res.redirect('/login')
        }),

        app.post('/register', function (req, res) {
            var form = forms.registrationForm.bind(req.body)
            var user = new User({
                'username': form.data.username, 
                'password': form.data.password,
                'firstName': form.data.firstName,
                'lastName': form.data.lastName,
                'displayName': form.data.firstName
            }).save()
            req.session.user = user
            req.session.save()
            res.redirect(req.param('next'))
        }),

        app.get('/', requireLogin, function (req, res) {
            cxt = {
               'host': self.config.hostname,
               'port': self.config.port,
               'media_url': self.config.media_url,
               'site_title': self.config.site_title,
               'page_title': "Development",
               'jsTemplates': self.template('jsTemplates.html'),
               'user': req.session.user.displayName
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
