var express = require('express')
var mustache = require('mustache')
var fs = require('fs')

var app = express.createServer()

var chatTemplate = fs.readFileSync("client/template/chat.tmpl").toString()
var headerTemplate = fs.readFileSync("client/template/header.tmpl").toString()
var footerTemplate = fs.readFileSync("client/template/footer.tmpl").toString()
var jsTemplates = fs.readFileSync("client/template/js-templates.tmpl").toString()

app.get('/', function (req, res) {
    cxt = {'media_url': '/media',
           'site_title': "Let's Chat Bro",
           'page_title': "Development",
           'jsTemplates': jsTemplates
            }
    res.send(mustache.to_html(chatTemplate, cxt, {
                                        'header': headerTemplate,
                                        'footer': footerTemplate}))
})

module.exports = app
