var express = require('express')
var mustache = require('mustache')
var fs = require('fs')
var MongoStore = require('connect-mongo')
var MemoryStore = express.session.MemoryStore
var User = require('./models/auth.js')
//var connect = require('connect')

var config = require('./configuration.js')

var app = express.createServer()

app.use(express.bodyParser())
app.use(express.cookieParser())
app.use(express.session({
    key: 'express.sid',
    secret: "DerpDerpDerp", //config.cookie_secret,
    store: new MemoryStore()
}))

var requireLogin = function (req, res, next) {
    console.log(req.session)
    if (req.session.user) {
        console.log("Bleee blaah blue")
        next()
    } else {
        console.log("Heee hurrr hoo")
        res.redirect('/login')
    }
}

var chatTemplate = fs.readFileSync("template/chat.html").toString()
var headerTemplate = fs.readFileSync("template/header.html").toString()
var footerTemplate = fs.readFileSync("template/footer.html").toString()
var jsTemplates = fs.readFileSync("template/js-templates.html").toString()
var loginTemplate = fs.readFileSync("template/loginTemplate.html").toString()

app.get('/login', function (req, res) {
    cxt = {
    'site_title': "Let's Chat Bro",
    'media_url': config.media_url,
    'next': req.param('next') || ''
    }
    res.send(mustache.to_html(loginTemplate, cxt))
})

app.post('/login', function (req, res) {
    var username = req.param('username')
    var password = req.param('password')
    console.log('username: ' + username + ' password: ' + password)
    var user = User.find({'username': username, 'password': password}).run( 
            function (error, users) {
                req.session.user = users[0]
                req.session.save()
                res.send(users)
    })
})

app.get('/register', function (req, res) {
    cxt = {
    'site_title': "Let's Chat Bro",
    'media_url': config.media_url,
    'next': req.param('next') || ''
    }
    res.send(mustache.to_html(loginTemplate, cxt))
})

app.post('/register', function (req, res) {
    var username = req.param('username')
    var password = req.param('password')
    console.log('username ' + username + 'password' + password)
    var user = new User({'username': username, 'password': password}).save()
    //user.save()
    res.send("User Created")
})

app.get('/', requireLogin, function (req, res) {
    cxt = {
           'host': config.hostname,
           'port': config.port,
           'media_url': config.media_url,
           'site_title': "Let's Chat Bro",
           'page_title': "Development",
           'jsTemplates': jsTemplates
            }
    res.send(mustache.to_html(chatTemplate, cxt, {
                                        'header': headerTemplate,
                                        'footer': footerTemplate}))
})

module.exports = app
