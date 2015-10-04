var express = require('express');
var app = express();
var login = require('./routes/login');
var signup = require('./routes/signup');
var getUsers = require('./routes/getUsers');
var path = require('path');
var Strategy = require('passport-local').Strategy;
var passport = require('passport');
var dbfile = "./routes/database.db"
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbfile, function(err) {
	if (!err) {
		db.serialize(function() {
			db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT)");
		});
		dbExisted = true;
	}
});

var loggedInUsers = {}

passport.use(new Strategy(
  function(username, password, cb) {
    login.findByUsername(username, function(err, user) {
      if (err) { return cb(err); }
      if (!user) { return cb(null, false); }
      if (user.password != password) { return cb(null, false); }
      return cb(null, user);
    });
  }));

passport.serializeUser(function(user, cb) {
  	cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
	console.log("deserializer: " + id);
  login.findById(id, function (err, user) {
    if (err) { return cb(err); }
    cb(null, user);
  });
});

app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'wahaha', resave: false, saveUninitialized: false }));

app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'routes')));

app.use(passport.initialize());
app.use(passport.session());

// Define routes.
app.get('/',
  function(req, res) {
    res.sendFile(__dirname + '/index.html');
  });

app.get('/login', function(req, res) {
  res.sendFile(__dirname + '/login.html');
});

app.get('/isLogin',
  function(req, res) {
    if (req.isAuthenticated()) {
      res.json(req.user);
    }else{
      res.end("NO");
    }
  });

app.post('/login',
  passport.authenticate('local', { failureRedirect: '/' }),
  function(req, res) {
  	loggedInUsers[req.user.username] = true;
  	console.log("login");
  	console.log(loggedInUsers);
    res.status(200).json({"success": true});
  });

app.get('/logout',
  function(req, res){
  	console.log("logout: " + req.user.username);
  	delete loggedInUsers[req.user.username];
    req.logout();
    console.log(loggedInUsers);
    res.redirect('/');
  });

app.post('/register', signup.register, passport.authenticate('local', { failureRedirect: '/' }),
  function(req, res) {
    loggedInUsers[req.user.username] = true;
    console.log("login");
    console.log(loggedInUsers);
    res.status(200).json({"success": true});
});
app.get('/getUsers', function(req, res){
  getUsers.getAllUsers(req, res, loggedInUsers);
});

app.listen(3000);
