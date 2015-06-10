//
// Users Controller
//

'use strict';

module.exports = function() {

    var app = this.app,
        core = this.core,
        middlewares = this.middlewares,
        models = this.models,
        User = models.user;

    //
    // Routes
    //
    app.get('/users/:id/avatar', middlewares.requireLogin, function(req, res) {

        var identifier = req.param('id');

        User.findByIdentifier(identifier, function (err, user) {

            if (err) {
                console.error(err);
                return res.status(400).json(err);
            }

            if (!user) {
                return res.sendStatus(404);
            }

            core.avatars.fetch({
                id: user.id
            }, function(err, image) {

                if (err) {
                    res.status(400).json(err);
                    return;
                }

                if (image && typeof image.pipe === 'function') {
                    res.setHeader('Content-Type', 'image/png');
                    image.pipe(res);
                    return;
                }

                res.sendStatus(500);

            });

        });

    });

};
