//
// Materia Client Controller
//

'use strict';

var express = require('express.oi'),
    path = require('path');

module.exports = function() {

    var app = this.app,
        middlewares = this.middlewares;

    app.use('/materia', express.static(path.resolve(__dirname, '../../materia/public')));

    app.get('/materia/*', middlewares.requireLogin, function(req, res, next) {

        if (/^\/materia\/assets/i.test(req.url)) {
            return next();
        }

        res.sendfile(path.resolve(__dirname, '../../materia/public/index.html'));

    });

};
