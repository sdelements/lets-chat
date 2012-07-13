var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var FileSchema = new Schema({
	owner: {
		type: Schema.ObjectId,
		ref: 'User',
        required: true
	},
    name: {
        type: String,
        required: true,
        trim: true
    },
	type: {
        type: String,
        required: true
    },
	size: {
        type: Number,
        required: true
    },
    uploaded: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('File', FileSchema);