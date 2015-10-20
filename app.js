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

var bodyParser = require('body-parser');

app.use(bodyParser.json()); // support JSON-encoded bodies
app.use(bodyParser.urlencoded( { // support URL-encoded bodies
  extended: true,
}));

var announcements = require('./routes/announcement');
var chatPrivately = require('./routes/chatPrivately');
var db = new sqlite3.Database(dbfile, function(err) {
	if (!err) {
		db.serialize(function() {
			db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, userStatus TEXT)");
			db.run("CREATE TABLE IF NOT EXISTS publicChat (id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT, message TEXT, timestamp INTEGER, senderStatus TEXT, senderLocation TEXT)");
			db.run("CREATE TABLE IF NOT EXISTS announcements (id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT, message TEXT, timestamp INTEGER)");
			db.run("CREATE TABLE IF NOT EXISTS privateChat (id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT, receiver TEXT, message TEXT, timestamp INTEGER, senderStatus TEXT, senderLocation TEXT)");

		});
		dbExisted = true;
	}
});

// var chatHistoryDBFile = "./routes/publicChat.db"
//
// var chatHistoryDB = new sqlite3.Database(chatHistoryDBFile, function(err) {
// 	if (!err) {
// 		chatHistoryDB.serialize(function() {
// 			chatHistoryDB.run("CREATE TABLE IF NOT EXISTS publicChat (id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT, message TEXT, timestamp INTEGER, sentStatus TEXT, sentLocation TEXT)");
// 		});
// 	}
// });

var loggedInUsers = {}
// var loggedInUsersSocketID = {}

passport.use(new Strategy(
  function(username, password, cb) {
		// console.log("Strategy");
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
	//console.log("deserializer: " + id);
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

function loginProcess(req, res){
  //
  loggedInUsers[req.user.username] = true;
  //console.log("login");
  //console.log(loggedInUsers);
  //socket.broadcast.emit('user join', req.user.username);

  if (req.statusCode && req.statusCode == 201) {
    res.status(201).json({"statusCode": req.statusCode, "username": req.user.username});
  }else {
    res.status(200).json({"statusCode": 200, "username": req.user.username});
  }

}

//RESTful API
//Define routes.
app.get('/',
  function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/login',
  function(req, res) {
    res.sendFile(__dirname + '/public/login.html');
});

app.post('/user/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    //console.log("authenticate");
    if (err) {
      // return next(err);
      console.log(err);
      return res.json({"statusCode": 401, "message": "Unauthorized"});
    }
    if (!user) {
      // return res.redirect('/login');
      console.log("!user");
      return res.json({"statusCode": 401, "message": "Unauthorized"});
    }
    req.logIn(user, function(err) {
      if (err) {
        // return next(err);
        console.log(err);
        return res.json({"statusCode": 401, "message": "Unauthorized"});
      }
      // return res.redirect('/users/' + user.username);
      //console.log("Good");
      return next();
    });
  })(req, res, next)
}, loginProcess);

app.get('/getPublicMessages',  function(req, res, next){
    login.checkLogin(req,res, next, loggedInUsers);
  }, chatPublicly.getPublicMessages);

app.get('/user/isLogin',  function(req, res, next){
    login.checkLogin(req,res, next, loggedInUsers);
  }, function(req, res){
      res.status(200).end("ok");
});

app.get('/users', function(req, res, next){
    login.checkLogin(req,res, next, loggedInUsers);
  }, function(req, res){
    getUsers.getAllUsers(req, res, loggedInUsers);
});

app.post('/user/signup', signup.register, function(req, res, next) {
    loggedInUsers[req.body.username] = true;
    next();
  }, passport.authenticate('local', { failureRedirect: '/' }),
    loginProcess
);

app.get('/user/logout',
  function(req, res){
    //console.log(req.query);
    //console.log("logout: " + req.query.username);
    delete loggedInUsers[req.query.username];
    //var user = req.user.username;
    //socket.broadcast.emit('user left', user);
    //req.logout();
    //console.log(loggedInUsers);
    res.status(200).end("ok");
    //res.redirect('/');
});

app.get('/getAnnoucements',  function(req, res, next){
    login.checkLogin(req,res, next, loggedInUsers);
  }, announcements.getAnnouncements);

app.post('/announcement',  function(req, res, next){
    login.checkLogin(req,res, next, loggedInUsers);
  }, announcements.postAnnouncement);

app.get('/getPrivateMessages',  function(req, res, next){
    login.checkLogin(req,res, next, loggedInUsers);
  }, chatPrivately.getPrivateMessagesBetween);

app.post('/privateMessage',  function(req, res, next){
    login.checkLogin(req,res, next, loggedInUsers);
  }, chatPrivately.postAPrivateMessage);

//socket event
io.on('connection', function(socket) {
  socket.on("user left", function(data){
    //console.log("receive user left "+ data);
    socket.broadcast.emit("user left", data);
  });

  socket.on("user join", function(data){
    console.log("receive new user");
    loggedInUsers[data] = socket.id;
    console.log("join: ", data);
    console.log("socketId: ", socket.id);
    //console.log(loggedInUsers);
    socket.broadcast.emit("user join", data);

  });

  //receive client add message
  socket.on("new public message", function(data) {
    var timestamp = Math.floor(Date.now() / 1000);
    var emitData = {
      "username": data.username,
      "message": data.message,
      "senderStatus": data.userStatus,
      "timestamp": timestamp
    };
    socket.broadcast.emit("new public message", emitData);
    socket.emit("new public message", emitData);
    db.serialize(function() {
      var command = "INSERT INTO publicChat (sender, message, timestamp, senderStatus, senderLocation) VALUES (?, ?, ?, ?, ?)";
      db.run(command, data.username, data.message, timestamp, data.userStatus, "");
    });
  });

  // share status
  socket.on("share status", function(data) {
    var timestamp = Math.floor(Date.now() / 1000);
    var emitData = {
      "username": data.username,
      "userStatus": data.userStatus,
      "timestamp": timestamp
    }
    socket.broadcast.emit("status update", emitData);
    socket.emit("status update", emitData);
    db.serialize(function() {
      // (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, userStatus TEXT)"
      db.run("UPDATE users SET userStatus = '" + data.userStatus + "' WHERE username = '" + data.username + "'");
    });
  });



  // chat private
  /*socket.on("new room", function(data) {
    var sender = data.sender;
    var receiver = data.receiver;
    var roomname = "";
    if (sender < receiver) {
      roomname = sender + receiver;
    }else{
      roomname = receiver + sender;
    }
    socket.join(roomname);
  });*/

  socket.on("new private message", function(data) {
    var timestamp = Math.floor(Date.now() / 1000);
    var emitData = {
      "sender": data.sender,
      "senderStatus": data.senderStatus,
      "receiver": data.receiver,
      "message": data.message,
      "timestamp": timestamp
    }

    /*var roomname = "";
    if (data.sender < data.receiver) {
      roomname = data.sender + data.receiver;
    } else {
      roomname = data.receiver + data.sender;
    }*/
    //console.log("emitdata: ",emitData);
		chatPrivately.insertMessage(emitData.sender, emitData.receiver, emitData.message, emitData.senderStatus, emitData.timestamp);
    var receiverId = loggedInUsers[data.receiver];
    var senderId = loggedInUsers[data.sender];
    io.to(receiverId).emit('new private message', emitData);
    io.to(senderId).emit('new private message', emitData);
  });

	socket.on("new announcement", function(message) {
    var timestamp = Math.floor(Date.now() / 1000);
    var msg = {
      "sender": message.username,
      "message": message.message,
      "timestamp": timestamp
    };
    socket.broadcast.emit("new announcement", msg);
    socket.emit("new announcement", msg);
    announcements.insertAnnoucement(msg.message, msg.sender, msg.timestamp);
  });


});

module.exports = app;
