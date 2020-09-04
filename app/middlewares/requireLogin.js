//
// Require Login
//

'use strict';

var passport = require('passport');
var Tokens = require('csrf');
var tokens = new Tokens();

function getMiddleware(fail) {
    return function(req, res, next) {

        if(req.method=='POST'){
            var fields = req.body || req.data;
            var csrfToken = fields._csrf || fields['_csrf'] || req.headers['xcsrf-token'];
            if(!tokens.verify(req.session._csrf, csrfToken)){
                res.sendStatus(401);
                return;
            }
        }

        if (req.user) {
            next();
            return;
        }

        if (req.headers && req.headers.authorization) {
            var parts = req.headers.authorization.split(' ');
            if (parts.length === 2) {
                var scheme = parts[0],
                    auth;

                if (/^Bearer$/i.test(scheme)) {
                    auth = passport.authenticate('bearer', { session: false });
                    return auth(req, res, next);
                }

                if (/^Basic$/i.test(scheme)) {
                    auth = passport.authenticate('basic', { session: false });
                    return auth(req, res, next);
                }
            }
        }

        fail(req, res);
    };
}

module.exports = getMiddleware(function(req, res) {
    res.sendStatus(401);
});

module.exports.redirect = getMiddleware(function(req, res) {
    res.redirect('/login');
});
