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

const bioSchema = new Schema({
  belongsTo: {
    type: String,
    default: 'no information added',
    required: true,
  },
  userDescription: {
    type: String,
    default: 'no description added',
    required: true,
  },
  workStatus: {
    type: String,
    default: 'work status not added',
    required: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

const Bio = mongoose.model("Bio", bioSchema);

// const makeBio = async (req, res) => {
//   const bio = new Bio({
//     belongsTo: "Hamirpur Himachal Pradesh",
//     userDescription: "Am cool, Yo Yo honey Singh, wish me on 31-JAN ",
//     workStatus: "Student",
//     author: "60a4c472c0396a4bb462ae72",
//   });
//   await bio.save();
// };

// makeBio();

module.exports = Bio;
