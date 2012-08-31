var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var slug = require ('slug');

var RoomSchema = new Schema({
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
		type: Schema.ObjectId,
		ref: 'User',
        required: true
    },
	admins: [{
		type: Schema.ObjectId,
		ref: 'User' 
	}],
	messages: [{
		type: Schema.ObjectId,
		ref: 'Message' 
	}],
    created: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Room', RoomSchema);
