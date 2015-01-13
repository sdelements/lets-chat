var mongoose = require("mongoose"),
    settings = require('./app/config');

module.exports = {
    connect: function(cb){
        mongoose.connect(settings.database.uri, function(err){
            if (err) { throw err; }
            cb();
        });
    }
};
