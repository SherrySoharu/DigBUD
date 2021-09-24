const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
  email: {
    //future:write code for email validation
    type: String,
    required: true,
    unique: true,
  },
  isPrivate: {
    type: String,
    default: 'false',
    required: true
  }
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

module.exports = User;
