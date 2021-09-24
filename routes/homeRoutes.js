const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware");
const Post = require("../models/Posts");
const User = require("../models/User");
const Bio = require("../models/Bio");
const Follow = require('../models/Follow');
const Comment = require('../models/Comments');
const ProfilePic = require('../models/profilePic');
const mongoose = require('mongoose');
const multer = require("multer");
const { storage } = require("../cloudinary/index");
const upload = multer({ storage });
const { cloudinary } = require("../cloudinary/index");


router.get("/", isLoggedIn, async (req, res) => {
  const follows = await Follow.find({ followerId: req.user._id });//this is the currentuser
  const followsId = follows.map(el => el.followeeId);//Id of all the users jinko currentUser follow krta hei.
  const followingsFollows = await Follow.find({ followerId: { $in: followsId } });//htese are the users followed by the currentuser.
  let ids = followingsFollows.map(el => el.followeeId.toString());//this is repeating version of the filtered version or you can say the older version.
  let filtered = followingsFollows.filter(({ followeeId }, index) => !ids.includes(followeeId.toString(), index + 1));//this are the non repeting users which are followed by those users which are followed by the current user.
  const one = filtered.map(el => el.followeeId.toString());
  const two = follows.map(el => el.followeeId.toString());
  const result = one.filter(item => !two.includes(item));
  const resultUsers = await User.find({ _id: { $in: result } });
  const profilePics = await ProfilePic.find({ author: { $in: result } });
  const usernames = await User.find({ _id: { $in: followsId } });
  const pps = await ProfilePic.find({ author: { $in: followsId } });
  const posts = await Post.find({ author: { $in: followsId } });//this is to show all the posts of those users whom the current user follows.
  res.render("home/home", { posts, pps, usernames, resultUsers, profilePics, followsId });
});

router.post("/addpost", isLoggedIn, upload.array('post'), async (req, res) => {
  const { description } = req.body;
  const newPost = new Post({ description });
  newPost.post = req.files.map((f) => ({
    url: f.path,
    filename: f.filename,
  }));
  newPost.author = req.user._id;
  await newPost.save();
  req.flash("success", "Post successfully added.");
  res.redirect("/home/profile");
});

router.get("/settings/bio", isLoggedIn, async (req, res) => {
  const bio = await Bio.find({ author: req.user._id });
  res.render("home/bio", { bio });
});

router.post("/settings/bio", isLoggedIn, async (req, res) => {
  const { belongsTo, userDescription, workStatus } = req.body;
  const bio = new Bio({ belongsTo, userDescription, workStatus });
  bio.author = req.user._id;
  await bio.save();
  req.flash("success", "Bio created");
  res.redirect("/home/profile");
});

router.put("/settings/bio", isLoggedIn, async (req, res) => {
  const { belongsTo, userDescription, workStatus } = req.body;
  await Bio.updateOne({ author: req.user._id },
    {
      belongsTo,
      userDescription,
      workStatus,
      author: req.user._id,
    });
  req.flash("success", "Bio successfully updated");
  res.redirect("/home/profile");
});

router.get('/setaccount', isLoggedIn, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.render('home/setAccount', { user });
});

router.put('/setaccount', isLoggedIn, async (req, res) => {
  const { isPrivate } = req.body;
  await User.findByIdAndUpdate(req.user._id, { isPrivate });
  req.flash('success', 'Account Settings Updated!!');
  res.redirect('/home/profile');
})

router.post('/profilePic', upload.single('pic'), async (req, res) => {
  const image = req.file;
  const profilePic = new ProfilePic({
    pic: {
      url: image.path,
      filename: image.filename,
    },
    author: req.user._id,
  });
  await profilePic.save();
  req.flash('success', 'ProfilePic added');
  res.redirect('/home/profile');
});

router.put('/profilePic', upload.single('pic'), async (req, res) => {
  const image = req.file;
  const oldPic = await ProfilePic.find({ author: req.user._id });
  await ProfilePic.updateOne({ author: req.user._id }, {
    pic: {
      url: image.path,
      filename: image.filename
    },
    author: req.user._id
  });
  await cloudinary.uploader.destroy(oldPic[0].pic.filename);
  req.flash('success', 'ProfilePic successfully Updated!!!');
  res.redirect('/home/profile');
})

router.get("/profile", isLoggedIn, async (req, res) => {
  const user = await User.findById(req.user._id);
  const posts = await Post.find({ author: req.user._id });
  const bio = await Bio.find({ author: req.user._id });
  const profilePic = await ProfilePic.findOne({ author: req.user._id });
  const follows = await Follow.find({ followeeId: req.user._id });//to show the no. of followers in the profile.
  const followIds = follows.map(el => el.followerId);
  const followerUsernames = await User.find({ _id: { $in: followIds } });
  const followerPics = await ProfilePic.find({ author: { $in: followIds } });
  const followings = await Follow.find({ followerId: req.user._id });//to shoe the following no.
  const followingIds = followings.map(el => el.followeeId);
  const followingUsernames = await User.find({ _id: { $in: followingIds } });
  const followingPics = await ProfilePic.find({ author: { $in: followingIds } });
  res.render("home/profile", { user, posts, bio, profilePic, follows, followings, followerUsernames, followerPics, followingUsernames, followingPics });
});

router.get('/explore', async (req, res) => {
  if (req.user) {
    const follows = await Follow.find({ followerId: req.user._id });
    const followeeIds = follows.map(el => el.followeeId);
    const explorePosts = await Post.find({ author: { $nin: followeeIds } });//posts when user is logged in
    const filteredExplorePosts = explorePosts.filter(el => el.author.toString() !== req.user._id.toString());
    res.render('home/explore', { filteredExplorePosts });
  } else {
    const allPosts = await Post.find();
    res.render('home/explore', { allPosts });
  }
})

//this route is to show the profile of some other user in our account
router.get('/:userId', isLoggedIn, async (req, res) => {
  const id = req.params;
  if (!mongoose.Types.ObjectId.isValid(id.userId)) return false;//CastError: Cast to ObjectId failed for value "comments" (type string) at path "_id" for model "User"  this line is added to soleve tis error.
  const user = await User.findById(id.userId);
  const userPosts = await Post.find({ author: id.userId });
  const userBio = await Bio.find({ author: id.userId });
  const userPic = await ProfilePic.find({ author: id.userId });
  const userFollowers = await Follow.find({ followeeId: id.userId });//to get no. of followers.
  const userFollowing = await Follow.find({ followerId: id.userId });//to shoe the following no.
  const check = await Follow.find({ followerId: req.user._id });
  const userFollowerIds = userFollowers.map(el => el.followerId);
  const userFollowingIds = userFollowing.map(el => el.followeeId);
  const userFollowerPics = await ProfilePic.find({ author: { $in: userFollowerIds } });
  const userFollowingPics = await ProfilePic.find({ author: { $in: userFollowingIds } });
  const followerUsernames = await User.find({ _id: { $in: userFollowerIds } });
  const followingUsernames = await User.find({ _id: { $in: userFollowingIds } });
  res.render('home/viewUser', { user, userPosts, userPic, userBio, check, userFollowers, userFollowing, userFollowerPics, userFollowingPics, followerUsernames, followingUsernames });
});

router.get('/:postId/comments', isLoggedIn, async (req, res) => {
  const id = req.params;
  const comments = await Comment.find({ author: id.postId });
  const trueCommentr = comments.map(el => el.commenter);
  const commenterUsernames = await User.find({ _id: { $in: trueCommentr } });
  const commenterPics = await ProfilePic.find({ author: { $in: trueCommentr } });
  const currentUserPic = await ProfilePic.findOne({ author: req.user._id });
  const post = await Post.findById({ _id: id.postId });
  res.render('home/comments', { comments, commenterPics, currentUserPic, post, commenterUsernames });
});

router.post('/:postId/comments', isLoggedIn, async (req, res) => {
  const id = req.params;
  const comment = new Comment(req.body);
  comment.commenter = req.user._id;
  comment.author = id.postId;
  await comment.save();
  res.redirect('/home/comments');
});

//this is the route to follow a user on home page recommendations.
router.post('/recommend/:userId', isLoggedIn, async (req, res) => {
  const id = req.params;
  const follower = new Follow({
    followeeId: id.userId,//jisko follow kr rha hei
    followerId: req.user._id//jo follow kr rha hei
  });
  await follower.save();
  res.redirect('/home');//still it needed to be redirected to the last visited page.
  // res.send('it is post follows')
});

//this is a route to unfollow a user on home page recommendation.
router.delete('/recommend/:userId', isLoggedIn, async (req, res) => {
  const id = req.params;
  await Follow.deleteOne({ followeeId: id.userId, followerId: req.user._id });
  res.redirect('/home');//still it needed to be redirected to the last visited page.
  // res.send('it is delete follows')
});

//this route is used to get the edit form to edit the selected post.
router.get('/profile/:postId', isLoggedIn, async (req, res) => {
  const id = req.params;
  const post = await Post.findById(id.postId);
  res.render('home/editPost', { post });
});

//this route is for updating the selected post.
router.put('/profile/:postId', isLoggedIn, upload.array('post'), async (req, res) => {
  const id = req.params;
  const post = await Post.findByIdAndUpdate(id.postId, req.body);
  const imags = req.files.map((f) => ({ url: f.path, filename: f.filename }));
  post.post.push(...imags);
  await post.save();
  if (req.body.deleteImages) {
    for (let filename of req.body.deleteImages) {
      await cloudinary.uploader.destroy(filename);
    }
    await post.updateOne({
      $pull: { post: { filename: { $in: req.body.deleteImages } } },
    });
  }
  req.flash('Post successfully updated');
  res.redirect('/home/profile');
});

//this route is to delete the post completely.
router.delete('/profile/:postId', isLoggedIn, async (req, res) => {
  const id = req.params;
  const post = await Post.findById(id.postId);
  const imags = post.post.map(f => f.filename);
  for (let i = 0; i < imags.length; i++) {
    await cloudinary.uploader.destroy(imags[i]);
  };
  await Post.findByIdAndDelete(id.postId);
  req.flash('success', 'Post successfully deleted.')
  res.redirect('/home/profile');
});



module.exports = router;
