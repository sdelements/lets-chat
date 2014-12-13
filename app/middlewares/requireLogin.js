//
// Require Login
//

'use strict';

module.exports = function(req, res, next) {
    if (req.session.userID) {
        next();
        return;
    }
    res.redirect('/login');
};
