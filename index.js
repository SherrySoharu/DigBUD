if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();

//this is socket.io stuff
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

const port = 3000;
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");
const homeRoutes = require("./routes/homeRoutes");
const ExpressError = require("./utils/ExpressError");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/User");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const { isLoggedIn } = require("./middleware");
const Follow = require('./models/Follow');
const Message = require('./models/Message');
const bodyParser = require('body-parser');

mongoose
  .connect("mongodb://localhost:27017/memer3", {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("DATABASE CONNECTED!!");
  })
  .catch((e) => {
    console.log("ERROR:", e);
  });

const path = require("path");
const ProfilePic = require("./models/profilePic");
const Post = require("./models/Posts");

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(__dirname + '/public'));

const sessionConfig = {
  name: "session",
  secret: "thisisasecret",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    // secure:true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session(sessionConfig));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.prevLink = req.originalUrl;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

io.on('connection', async (socket) => {
  socket.on('currentId', async (currentUserObject, selectedUser) => {
    const sentMsg = await Message.find({ author: currentUserObject._id, whom: selectedUser });
    const receivedMsg = await Message.find({ author: selectedUser, whom: currentUserObject._id });
    const profilePics = await ProfilePic.find({ author: { $in: [selectedUser, currentUserObject._id] } });
    const friendName = await User.findById(selectedUser);
    socket.emit('output message', sentMsg, receivedMsg, profilePics, friendName);
  });

  //now it is for the like feature.
  socket.on('adding like', async (arg1, arg2) => {
    console.log('agr1:', arg1);
    console.log('arg2:', arg2);
    let post = await Post.findById(arg1);
    console.log('post.likes', post.likes);
    post.likes.push(arg2);
    await post.save();
  });

  socket.on('removing like', async (arg1, arg2) => {
    console.log('agr1:', arg1);
    console.log('arg2:', arg2);
    let post = await Post.findById(arg1);
    console.log('post.likes', post.likes);
    let index = post.likes.indexOf(arg2);
    console.log('index', index);
    if (index > -1) {
      post.likes.splice(index, 1);
    }
    console.log('remove happened in server side');
    await post.save();
  });

  // let connections = {};

  // socket.on('connected user', (data) => {
  //   connections[socket.id] = data;
  //   console.log(connections);
  // });

  console.log('A user connected');

  socket.on('disconnect', () => {
    console.log('user Disconnected');
  });

  socket.on('chat message', async (arg1, arg2, arg3) => {
    const message = new Message({
      message: arg1,
      author: arg2,
      whom: arg3
    });
    await message.save();
    io.emit('chat message', message);
  });

});

app.use("/", userRoutes);
app.use("/home", homeRoutes);

app.use('/chat', isLoggedIn, async (req, res) => {
  const follows = await Follow.find({ followerId: req.user._id });
  const followsIds = follows.map(el => el.followeeId);
  const followingUsers = await User.find({ _id: { $in: followsIds } });
  const followingPics = await ProfilePic.find({ author: { $in: followingUsers } });
  const userPic = await ProfilePic.findOne({ author: req.user._id });
  res.render('chat', { followingUsers, userPic, followingPics });
});


app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "oh ,no something went wrong";
  res.status(statusCode).render("error", { err });
});

server.listen(port, () => {
  console.log("SERVING ON PORT 3000!!");
});
