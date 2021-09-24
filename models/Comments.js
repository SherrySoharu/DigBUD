const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// mongoose
//     .connect("mongodb://localhost:27017/memer3", {
//         useNewUrlParser: true,
//         useCreateIndex: true,
//         useUnifiedTopology: true,
//         useFindAndModify: false,
//     })
//     .then(() => {
//         console.log("DATABASE CONNECTED!!");
//     })
//     .catch((e) => {
//         console.log("ERROR:", e);
//     });

const commentSchema = new Schema({
    commentText: {
        type: String,
        required: true
    },
    commenter: {
        type: Schema.Types.ObjectId,
        required: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    }
});

const Comment = mongoose.model('Comment', commentSchema);

// const makeComment = async () => {
//     const comment = new Comment({
//         commentText: 'She holds the biggest part of my life, today whereever I am because of my mom and dad, luv you mom.',
//         commenter: '60a4c472c0396a4bb462ae72',
//         author: '60a7c63400999e32ecc68922'
//     });
//     await comment.save();
// }

// makeComment();

module.exports = Comment;