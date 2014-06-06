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
                // Temporary workaround for _id until populate can do aliasing
                models.user.findOne(message.owner, function(err, user) {
                    message = message.toJSON();
                    message.owner = user.toJSON();
                    req.io.respond(message, 201);
                    req.io.room(message.room).broadcast('messages:new', message);
                });
            });
        },
        list: function(req) {
            var data = req.data || req.query;
            models.message
                .find({
                    room: data.room || null
                })
                // This is why the terrorists hate us
                .populate('owner', 'id displayName email avatar')
                .limit(data.limit || 500)
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
