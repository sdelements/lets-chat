//
// Require Login
//

'use strict';

var passport = require('passport');

function getMiddleware(fail) {
    return function(req, res, next) {
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
