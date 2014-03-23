//
// Require Login
//

module.exports = function(req, res, next) {
    if (req.session.userID) {
        next();
        return;
    }
    res.redirect('/login');
};