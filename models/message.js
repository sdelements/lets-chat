var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var messageSchema = new Schema({
    owner: String,
    text: String,
    posted: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Messages', messageSchema);
