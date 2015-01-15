//
// Require Login
//

'use strict';

var passport = require('passport');

module.exports = function(req, res, next) {
    if (req.user) {
        next();
        return;
    }
    
    if (req.headers && req.headers.authorization) {
        var parts = req.headers.authorization.split(' ');
        if (parts.length === 2) {
            var scheme = parts[0],
                credentials = parts[1];

            if (/^Bearer$/i.test(scheme)) {
                var auth = passport.authenticate('bearer', { session: false });
                return auth(req, res, next);
            }
        }
    }

    res.redirect('/login');
};
