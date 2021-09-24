const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const profilePicSchema = new Schema({
    pic: {
        url: String,
        filename: String
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

const ProfilePic = mongoose.model('ProfilePic', profilePicSchema);

module.exports = ProfilePic;

