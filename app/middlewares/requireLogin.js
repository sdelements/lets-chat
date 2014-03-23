//
// Rqeure Login
//

module.exports = function(req, res, next) {
    if (req.session.userID) {
        next();
    } else {
        res.redirect('/login');
    }
};