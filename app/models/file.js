var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var FileSchema = new Schema({
	owner: {
		type: Schema.ObjectId,
		ref: 'User' 
	},
    name: String,
	type: String,
	size: Number,
    uploaded: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('File', FileSchema);