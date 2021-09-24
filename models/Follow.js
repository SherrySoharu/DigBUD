const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const followSchema = new Schema({
    followeeId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    followerId: {
        type: Schema.Types.ObjectId,
        required: true
    }
});

const Follow = mongoose.model('Follow', followSchema);

module.exports = Follow;