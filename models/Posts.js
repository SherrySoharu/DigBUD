const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// mongoose
//   .connect("mongodb://localhost:27017/memer3", {
//     useNewUrlParser: true,
//     useCreateIndex: true,
//     useUnifiedTopology: true,
//     useFindAndModify: false,
//   })
//   .then(() => {
//     console.log("DATABASE CONNECTED!!");
//   })
//   .catch((e) => {
//     console.log("ERROR:", e);
//   });

const imageSchema = new Schema({
  url: String,
  filename: String,
});

imageSchema.virtual('thumbnail').get(function () {
  return this.url.replace('/upload/w_200');
});


const postSchema = new Schema({
  post: [imageSchema],
  description: {
    type: String,
    required: true,
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
});

const Post = mongoose.model("Post", postSchema);

// const makePost = async () => {
//   const post = new Post({
//     post: "https://i.pinimg.com/originals/db/00/ab/db00abcf6c5909bf4763f8c30fbe1701.jpg",
//     description:
//       "this painting is very close to my heart. I completed it when I was 7 years old.",
//     likes: "26",
//     author: "60a4c472c0396a4bb462ae72",
//     uploadDate: "21-Jan-1984",
//   });
//   await post.save();
// };

// makePost();

module.exports = Post;
