var express = require('express');
var router = express.Router();
const userModel = require('./users');
const postModel = require('./posts');
const passport = require('passport');
const localStrategy = require('passport-local');
passport.use(new localStrategy(userModel.authenticate()));
const upload = require('./multer');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index');
});
/* GET login page */
router.get('/login', function (req, res, next) {
  res.render('login', { error: req.flash('error') });
});
/* GET feed page */
router.get('/feed', function (req, res, next) {
  res.render('feed');
});

/* POST Upload Images */
router.post('/upload', isLoggedIn, upload.single('file'), async function (req, res, next) {
  if (!req.file) {
    return res.status(404).send("No files were given");
  }
  //save the uploaded file as a post and give the post id to user and userid to post
  const user = await userModel.findOne({ username: req.session.passport.user });
  const post = await postModel.create({
    image: req.file.filename,
    imageText: req.body.filecaption,
    user: user._id
  });

  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
});

/* Register the user. */
router.post('/register', function (req, res) {
  const userData = new userModel({
    username: req.body.username,
    email: req.body.email,
    fullname: req.body.fullname
  })

  userModel.register(userData, req.body.password)
    .then(function (registeredUser) {
      passport.authenticate("local")(req, res, function () {
        res.redirect('/profile');
      })
    })
});


router.post('/login', passport.authenticate("local", {
  successRedirect: '/profile',
  failureRedirect: '/login',
  failureFlash: true
}), function (req, res) {
});

router.get('/logout', (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  })
})
router.get('/profile', isLoggedIn, async (req, res, next) => {
  let user = await userModel.findOne({
    username: req.session.passport.user
  }).populate('posts');
  console.log(user);
  res.render("profile", { user });
})



function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}







module.exports = router;
