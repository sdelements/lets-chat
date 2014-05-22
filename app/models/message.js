//
// Message
//

var mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.Types.ObjectId;

var MessageSchema = new mongoose.Schema({
    room: {
        type: ObjectId,
        ref: 'Room',
        required: true
    },
    owner: {
        type: ObjectId,
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

MessageSchema.method('toJSON', function() {
    var message = this.toObject();
    return {
        id: message._id,
        room: message.room,
        owner: message.owner,
        text: message.text,
        posted: message.posted
    }
 });

module.exports = mongoose.model('Message', MessageSchema);
