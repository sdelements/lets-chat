//
// Populate User (if logged in!)
//

var models = require('../models');

module.exports = function(req, res, next) {
    next = next || res; // No res object if called as a socket.io middleware
    if (req.session && req.session.userID) {
        models.user.findById(req.session.userID, function(err, user) {
            if (!err && user) {
                req.user = user;
                next();
                return;
            }
            next(new Error('Could not get the user for this session!'));
        });
        return;
    }
    next();
};
