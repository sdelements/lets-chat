//
// Message
//

var mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.Types.ObjectId;
    
var MessageSchema = new mongoose.Schema({
    room: {
        type: ObjectId,
        ref: 'Room',
        // required: true
    },
    owner: {
        type: ObjectId,
        ref: 'User',
        // required: true
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