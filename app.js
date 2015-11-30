var express = require('express');
var app = express();
var login = require('./routes/login');
var signup = require('./routes/signup');
var getUsers = require('./routes/getUsers');
var chatPublicly = require('./routes/chatPublicly');
var chatPubliclyTest = require('./routes/test');
var profile = require('./routes/profile');
var path = require('path');
var Strategy = require('passport-local').Strategy;
var passport = require('passport');
var dbfile = "./routes/database.db";
var sqlite3 = require('sqlite3').verbose();
var multer = require('multer');
var fs = require('fs')

var bodyParser = require('body-parser');

if (!fs.existsSync("./uploads")){
    fs.mkdirSync("./uploads");
}

app.use(bodyParser.json({
  limit: '50mb',
  parameterLimit: 10000
})); // support JSON-encoded bodies
app.use(bodyParser.urlencoded( { // support URL-encoded bodies
  extended: true,
  limit: '50mb',
  parameterLimit: 10000
}));

var announcements = require('./routes/announcement');
var chatPrivately = require('./routes/chatPrivately');
var db = new sqlite3.Database(dbfile, function(err) {
	if (!err) {
		db.serialize(function() {
			db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, userStatus TEXT, level TEXT DEFAULT 'Citizen', accountStatus TEXT DEFAULT 'active')");
			db.run("CREATE TABLE IF NOT EXISTS publicChat (id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT, message TEXT, type TEXT, timestamp INTEGER, senderStatus TEXT, senderLocation TEXT)");
			db.run("CREATE TABLE IF NOT EXISTS announcements (id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT, message TEXT, timestamp INTEGER)");
			db.run("CREATE TABLE IF NOT EXISTS privateChat (id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT, receiver TEXT, message TEXT, type TEXT, timestamp INTEGER, senderStatus TEXT, senderLocation TEXT)");
      db.run("CREATE TABLE IF NOT EXISTS publicChatTest (id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT, message TEXT, timestamp INTEGER, senderStatus TEXT, senderLocation TEXT)");
      var sqlstm = "SELECT * FROM users WHERE username='SSNAdmin'";
      db.get(sqlstm, function(err, row){
        if (err) {
          console.log(err);
        }else{
          if (!row) {
            console.log("Not found");
            db.run("INSERT into users (username, password, level, userStatus) VALUES (?, ?, ?, ?)", "SSNAdmin", "admin", "Administrator", "OK");
          }
        }
      });
		});
		dbExisted = true;
	}
});

var isTesting = false;
var testRunner = "";
var loggedInUsers = {}
var loggedInUserLevel = {}

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    var originalname = file.originalname;
    var extension = originalname.split(".");
    filename = req.user.username +  Date.now() + '.' + extension[extension.length-1];
    console.log(filename);
    cb(null, filename);
  }
});

function fileFilter (req, file, cb){
  var type = file.mimetype;
  console.log(type);
  var typeArray = type.split("/");
  if (typeArray[0] == "video" || typeArray[0] == "image") {
    cb(null, true);
  }else {
    cb(null, false);
  }
}

var upload = multer({storage: storage, dest: "uploads/", fileFilter: fileFilter});

passport.use(new Strategy(
  function(username, password, cb) {
		// console.log("Strategy");
    if (loggedInUsers[username]) {
      var dic ={}
      dic["username"] = username;
      return cb(null, dic);
    }
    login.findByUsername(username, function(err, user) {
      if (err) { return cb(err); }
      if (!user) { return cb(null, false); }
      if (user.password != password) { return cb(null, false); }
      delete user.password;
      return cb(null, user);
    });
  }));

passport.serializeUser(function(user, cb) {
  	cb(null, user.username);
});

passport.deserializeUser(function(id, cb) {
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
app.use(express.static('public'));

app.use(passport.initialize());
app.use(passport.session());

var server = app.listen(3000);
var io = require('socket.io')(server);

function loginProcess(req, res){
  loggedInUsers[req.user.username] = true;
  loggedInUserLevel[req.user.username] = req.user.level;
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
    if (err) {
      console.log(err);
      return res.json({"statusCode": 401, "message": "Unauthorized"});
    }
    if (!user) {
      console.log("!user");
      return res.json({"statusCode": 401, "message": "Unauthorized"});
    }
    req.logIn(user, function(err) {
      if (err) {
        console.log(err);
        return res.json({"statusCode": 401, "message": "Unauthorized"});
      }

      return next();
    });
  })(req, res, next)
}, loginProcess);

app.post('/upload', upload.single('photo'), function(req, res, next) {
  console.log("Uploaded");
  res.json({"statusCode": 200, "filename": req.file.filename, "type": req.file.mimetype});
});

app.get('/getPublicMessageTest',function(req, res, next){
    if (isTesting) {
      next();
    }else {
      res.json({"statusCode": 401, "message": "Test is not running."});
    }
  } ,function(req, res, next){
    login.checkLogin(req, res, next, loggedInUsers, isTesting);
  }, chatPubliclyTest.getPublicMessages);

app.post('/postPublicMessageTest', function(req, res, next){
    if (isTesting) {
      next();
    }else {
      res.json({"statusCode": 401, "message": "Test is not running."});
    }
  }, function(req, res, next){
    login.checkLogin(req, res, next, loggedInUsers, isTesting);
  }, chatPubliclyTest.postPublicMessage);

// app.get('/startTest', function(req, res, next){
//   login.checkLogin(req, res, next, loggedInUsers, isTesting);
// }, function(req, res, next){
//   chatPubliclyTest.startFromAPI(req, res, next);
// }, function(req, res, next){
//   if (isTesting) {
//     res.json({"statusCode": 401, "message": "Test is running."});
//   }else {
//     isTesting = true;
//     testRunner = req.user.username;
//     res.json({"statusCode": 200, "message": "You can start testing."});
//   }
// });

app.get('/stopTest', function(req, res, next){
  login.checkLogin(req, res, next, loggedInUsers, isTesting);
}, function(req, res, next) {
  if (isTesting) {
    isTesting = false;
    testRunner = "";
    res.json({"statusCode": 200, "message": "Test stopped."});
  }else {
    res.json({"statusCode": 401, "message": "You are not testing."});
  }
});

app.get('/getPublicMessages',  function(req, res, next){
    login.checkLogin(req, res, next, loggedInUsers, isTesting);
  }, chatPublicly.getPublicMessages);

app.get('/searchPublicMessages',  function(req, res, next){
    login.checkLogin(req, res, next, loggedInUsers, isTesting);
  }, chatPublicly.searchPublicMessages);

app.get('/user/isLogin',  function(req, res, next){
    login.checkLogin(req, res, next, loggedInUsers, isTesting);
  }, function(req, res){
      res.status(200).end("ok");
});

app.get('/users', function(req, res, next){
    login.checkLogin(req, res, next, loggedInUsers, isTesting);
  }, function(req, res){
    getUsers.getAllUsers(req, res, loggedInUsers);
});

app.get('/users/name',  function(req, res, next){
    login.checkLogin(req, res, next, loggedInUsers, isTesting);
  }, function(req, res){
     getUsers.searchUsers(req, res, loggedInUsers)
  });

app.get('/users/status',  function(req, res, next){
    login.checkLogin(req, res, next, loggedInUsers, isTesting);
  }, function(req, res){
    getUsers.showUsersByStatus(req, res, loggedInUsers)
  });

app.post('/user/signup', signup.register, function(req, res, next) {
    loggedInUsers[req.body.username] = true;
    next();
  }, passport.authenticate('local', { failureRedirect: '/' }),
    loginProcess
);

app.get('/user/logout',
  function(req, res){
    delete loggedInUsers[req.query.username];
    req.logout();
    res.status(200).end("ok");
});

app.get('/getAnnoucements',  function(req, res, next){
    login.checkLogin(req, res, next, loggedInUsers, isTesting);
  }, announcements.getAnnouncements);

app.get('/searchAnnouncements',  function(req, res, next){
    login.checkLogin(req, res, next, loggedInUsers, isTesting);
  }, announcements.searchAnnouncements);

app.post('/announcement',  function(req, res, next){
    login.checkLogin(req, res, next, loggedInUsers, isTesting);
  }, announcements.postAnnouncement);

app.get('/getPrivateMessages',  function(req, res, next){
    login.checkLogin(req, res, next, loggedInUsers, isTesting);
  }, chatPrivately.getPrivateMessagesBetween);

app.get('/searchPrivateMessages',  function(req, res, next){
    login.checkLogin(req, res, next, loggedInUsers, isTesting);
  }, chatPrivately.searchPrivateMessages);

app.post('/privateMessage',  function(req, res, next){
    login.checkLogin(req, res, next, loggedInUsers, isTesting);
  }, chatPrivately.postAPrivateMessage);


app.get('/allUserProfiles',  function(req, res, next){
    login.checkLogin(req, res, next, loggedInUsers, isTesting);
  }, profile.getProfileList);

app.post('/updateUserProfile',  function(req, res, next){
    login.checkLogin(req, res, next, loggedInUsers, isTesting);
  }, profile.updateUserProfile);

// app.get('/postPublicMessageTest',
//   function(req, res){
//     console.log("in post test");
//     res.status(200).end("ok");
// });

// app.get('/getPublicMessageTest',
//   function(req, res){
//     console.log("in get test");
//     res.status(200).end("ok");
// });

//socket event
io.on('connection', function(socket) {
  socket.on("user left", function(data){
    socket.broadcast.emit("user left", data);
  });

  socket.on("user join", function(data){
    console.log("receive new user");
    loggedInUsers[data] = socket.id;
    console.log("join: ", data);
    console.log("socketId: ", socket.id);
    socket.broadcast.emit("user join", data);

  });

   socket.on("interupt measuring performance",function(data){
    console.log("Receive Interupt Socket From User");
    socket.emit("interupt measuring performance",data);
    socket.broadcast.emit("stop measuring performance", data);
   });

  socket.on("start measuring performance", function(data){
    if (isTesting) {
      return;
    }
    if (loggedInUserLevel[message.username] == "Citizen" || loggedInUserLevel[message.username] == "Coordinator"){
      return;
    }
    isTesting = true;
    testRunner = data.username;

    socket.broadcast.emit("start measuring performance", data);
    chatPubliclyTest.startFromSocket();
    //console.log("in start ");
  });

  socket.on("stop measuring performance", function(data){
    if (!isTesting) {
      return;
    }
    isTesting = false;

    socket.emit("stop measuring performance", data);
    socket.broadcast.emit("stop measuring performance", data);

  });

  //receive client add message
  socket.on("new public message", function(data) {
    if (isTesting) {
      return;
    }
    var timestamp = Math.floor(Date.now() / 1000);
    var emitData = {
      "username": data.username,
      "message": data.message,
      "senderStatus": data.userStatus,
      "timestamp": timestamp,
      "type": data.type
    };
    socket.broadcast.emit("new public message", emitData);
    socket.emit("new public message", emitData);
    db.serialize(function() {
      var command = "INSERT INTO publicChat (sender, message, timestamp, senderStatus, senderLocation, type) VALUES (?, ?, ?, ?, ?, ?)";
      db.run(command, data.username, data.message, timestamp, data.userStatus, "", data.type);
    });
  });

  // share status
  socket.on("share status", function(data) {
    if (isTesting) {
      return;
    }
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


  socket.on("new private message", function(data) {
    if (isTesting) {
      return;
    }
    var timestamp = Math.floor(Date.now() / 1000);
    var emitData = {
      "sender": data.sender,
      "senderStatus": data.senderStatus,
      "receiver": data.receiver,
      "message": data.message,
      "timestamp": timestamp,
      "type": data.type
    }

		chatPrivately.insertMessage(emitData.sender, emitData.receiver, emitData.message, emitData.senderStatus, emitData.timestamp, data.type);
    var receiverId = loggedInUsers[data.receiver];
    var senderId = loggedInUsers[data.sender];
    io.to(receiverId).emit('new private message', emitData);
    io.to(senderId).emit('new private message', emitData);
  });

	socket.on("new announcement", function(message) {
    if (isTesting) {
      return;
    }
    if (loggedInUserLevel[message.username] == "Citizen" || loggedInUserLevel[message.username] == "Monitor"){
      return;
    }
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
