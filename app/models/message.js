var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var MessageSchema = new Schema({
    room: {
		type: Schema.ObjectId,
		ref: 'Room',
        required: true
    },
    owner: {
		type: Schema.ObjectId,
		ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true,
        trim: true
    },
    posted: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Message', MessageSchema);
