//
// Room
//

var mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.Types.ObjectId;

var RoomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    owner: {
		type: ObjectId,
		ref: 'User',
        required: true
    },
	messages: [{
		type: ObjectId,
		ref: 'Message'
	}],
    created: {
        type: Date,
        default: Date.now
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
});

RoomSchema.method('toJSON', function() {
    var room = this.toObject();
    return {
        id: room._id,
        name: room.name,
        description: room.description,
        lastActive: room.lastActive,
        created: room.created,
        owner: room.owner
    }
 });

module.exports = mongoose.model('Room', RoomSchema);
