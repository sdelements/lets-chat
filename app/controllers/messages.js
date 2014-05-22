//
// Messages Controller
//

module.exports = function() {
    var app = this.app,
        middlewares = this.middlewares,
        models = this.models;

    //
    // Routes
    //
    app.get('/messages', middlewares.requireLogin, function(req, res) {
        req.io.route('messages:list');
    });

    app.post('/messages', middlewares.requireLogin, function(req, res) {
        req.io.route('messages:create');
    });

    //
    // Sockets
    //
    app.io.route('messages', {
        create: function(req) {
            var data = req.data || req.body;
            models.message.create({
                owner: req.user._id,
                room: data.room,
                text: data.text
            }, function(err, message) {
                if (err) {
                    console.error(err);
                    req.io.respond(err, 400);
                    return;
                }
                req.io.respond(message, 201);
                app.io.room(message.room).broadcast('messages:new', message.toJSON());
            });
        },
        list: function(req) {
            models.message
                .find()
                .limit(20)
                .sort({ 'posted': -1 })
                .exec(function(err, messages) {
                if (err) {
                    console.error(err);
                    req.io.respond(err, 400);
                    return;
                }
                req.io.respond(messages.reverse());
            });
        }
    });

}