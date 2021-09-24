const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now()
    },
    whom: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        requied: true
    }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;