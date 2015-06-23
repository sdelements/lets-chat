//
// Avatar Controller
//

'use strict';

module.exports = function() {

    var app = this.app,
        core = this.core,
        middlewares = this.middlewares;

    //
    // Routes
    //
    app.get('/users/:id/avatar', middlewares.requireLogin, function(req, res) {

        var identifier = req.param('id'),
            size = parseInt(req.param('size'), 10) || 50;

        core.avatars.fetch({
            id: identifier,
            size: size
        }, function(err, avatar) {

            if (err) {
                console.error(err);
                res.status(400).json(err);
                return;
            }

            if (!avatar) {
                res.sendStatus(404);
                return;
            }

            if (avatar && avatar.raw) {
                res.setHeader('Content-Type', avatar.type || 'image/png');
                if (typeof avatar.raw.pipe === 'function') {
                    avatar.raw.pipe(res);
                    return;
                }
                res.send(avatar.raw);
                return;
            }

            res.sendStatus(500);

        });

    });

};
