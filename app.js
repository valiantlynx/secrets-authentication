require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose"); // passport-local is a dependency of passport-local-mongoose so we dont need to require it
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false

}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

//serialize and deserialize
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

//google strategy
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.REDIRECT_URLS,
    userProfileURL: process.env.AUTH_PROVIDER_X509_CERT_URL
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//home
app.route('/')
    .get(function(req, res) {
        res.render("home");
    });


//auth/google
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect SECRETS.
    res.redirect('/secrets');
  });


//login
app.route('/login')
    .get(function(req, res) {
        res.render("login");
    })
    .post(function(req, res) {
       const user = new User({
           username: req.body.username,
           password: req.body.password
       });

       req.login(user, function(err){
           if (err){
               console.log(err);
           }else{
               passport.authenticate("local")(req, res, function(){
                   res.redirect("/secrets");
               });
           }
       })

    });

//logout
 app.route("/logout")
    .get(function(req, res){
        req.logout(function(err) {
            if (err) { 
                console.log(err);
             }else{
                res.redirect('/');
             }
          });
    });

//secrets    
app.route('/secrets')
    .get(function(req, res){
        if(req.isAuthenticated()){
            res.render("secrets");
        }else{
            res.redirect("/login");
        }

    });

//register
app.route('/register')
    .get(function(req, res) {
        res.render("register");
    })
    .post(function(req, res) {
      
        User.register({username: req.body.username}, req.body.password, function (err, user){
            if(err) {
                console.log(err);
                res.redirect("/register");
            } else {
                passport.authenticate("local")(req, res, function (){
                    res.redirect("/secrets");
                });
            }
        })
    });



app.listen(3000, function() {
    console.log("Server running on port 3000");
});

