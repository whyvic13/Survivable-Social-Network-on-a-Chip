var express = require('express');
var app = express();
var login = require('./routes/login');
var signup = require('./routes/signup');
var getUsers = require('./routes/getUsers');
var chatPublicly = require('./routes/chatPublicly');
var path = require('path');
var Strategy = require('passport-local').Strategy;
var passport = require('passport');
var dbfile = "./routes/database.db";
var sqlite3 = require('sqlite3').verbose();
// var chatPublicly = require('./routes/socketChatPublic');
var db = new sqlite3.Database(dbfile, function(err) {
	if (!err) {
		db.serialize(function() {
			db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT)");
		});
		dbExisted = true;
	}
});

var chatHistoryDBFile = "./routes/publicChat.db"

var chatHistoryDB = new sqlite3.Database(chatHistoryDBFile, function(err) {
	if (!err) {
		chatHistoryDB.serialize(function() {
			chatHistoryDB.run("CREATE TABLE IF NOT EXISTS publicChat (id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT, message TEXT, timestamp INTEGER, sentStatus TEXT, sentLocation TEXT)");
		});
	}
});

var loggedInUsers = {}

passport.use(new Strategy(
  function(username, password, cb) {
    if (loggedInUsers[username]) {
      var dic ={}
      dic["username"] = username;
      // console.log("This way");
      return cb(null, dic);
    }
    login.findByUsername(username, function(err, user) {
      // console.log("ASD");
      if (err) { return cb(err); }
      if (!user) { return cb(null, false); }
      if (user.password != password) { return cb(null, false); }
      return cb(null, user);
    });
  }));

passport.serializeUser(function(user, cb) {
  	cb(null, user.username);
});

passport.deserializeUser(function(id, cb) {
	console.log("deserializer: " + id);
  login.findByUsername(id, function (err, user) {
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

var server = app.listen(3000);
var io = require('socket.io')(server);

// Define routes.
app.get('/',
  function(req, res) {
    res.sendFile(__dirname + '/index.html');
  });

app.get('/login', function(req, res) {
  res.sendFile(__dirname + '/login.html');
});



// app.get('/isLogin',
//   function(req, res) {
//     if (req.isAuthenticated()) {
//       res.json(req.user);
//     }else{
//       res.end("NO");
//     }
//   });

function loginProcess(req, res){
  loggedInUsers[req.user.username] = true;
  console.log("login");
  console.log(loggedInUsers);
  io.on('connection', function(socket){
    io.emit('user join', req.user.username);
  });
  res.status(200).json({"success": true});
}

app.post('/user/login',
  passport.authenticate('local', { failureRedirect: '/' }), loginProcess
);

app.get('/user/logout',
  function(req, res){
  	console.log("logout: " + req.user.username);
  	delete loggedInUsers[req.user.username];
    io.on('connection', function(socket){
      io.emit('user left', req.user.username);
    });
    req.logout();
    console.log(loggedInUsers);
    res.redirect('/');
  });

app.post('/user/signup', signup.register, function(req, res, next){
  console.log(req.body.username);
  loggedInUsers[req.body.username] = true;
  next();
}, passport.authenticate('local', { failureRedirect: '/' }),
  loginProcess
);
app.get('/users', function(req, res, next){
  login.checkLogin(req,res, next, loggedInUsers);
}, function(req, res){
  getUsers.getAllUsers(req, res, loggedInUsers);
});

io.on("connection", function(socket) {
	socket.on("new public message", function(message) {
		var timestamp = Math.floor(Date.now() / 1000);
		var msg = {
      "username": message.username,
      "message": message.message,
      "timestamp": timestamp
    };
    io.emit("new public message", msg)
		chatHistoryDB.serialize(function() {
			var command = "INSERT INTO publicChat (sender, message, timestamp, sentStatus, sentLocation) VALUES (?, ?, ?, ?, ?)";
			chatHistoryDB.run(command, message.username, message.message, timestamp, "", "");
		});
	});
});

app.get('/getPublicMessages',  function(req, res, next){
  login.checkLogin(req,res, next, loggedInUsers);
}, chatPublicly.getPublicMessages);

app.get('/test', function(req, res, next){
  login.checkLogin(req,res, next, loggedInUsers);
}, function(req, res){
  res.end("Z");
});
