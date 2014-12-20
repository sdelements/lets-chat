//
// Require Login
//

'use strict';

module.exports = function(req, res, next) {
    if (req.user) {
        next();
        return;
    }
    res.redirect('/login');
};
