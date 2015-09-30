// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;
// messages in database
var messages = [];


//database
var fs = require('fs');
var file = "chatroom.db";
var exists = fs.existsSync(file);
if(!exists) {
  console.log("Creating DB file.");
  fs.openSync(file, "w");
}
var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database(file);
// do Initialize
db.serialize(function() {
  db.run("CREATE TABLE if not exists user_info (name TEXT, psw TEXT)");
  db.run("CREATE TABLE if not exists chat_content (name TEXT, content TEXT, time TEXT)");
  db.each("SELECT name,content,time FROM chat_content ORDER BY rowid", function(err, row) {
    if(err) throw(err);
    messages.push({name:row.name, data:row.content, printTime:row.time});
  });
});

//db.close();

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname ));

// Chatroom + '/public')

// usernames which are currently connected to the chat
var usernames = {};
var numUsers = 0;
// messages storage since the first user come in
var storeMessage = function(name,data,printTime){
  //insert into db
  var stmt = db.prepare("INSERT INTO chat_content VALUES (?,?,?)");
  stmt.run(name,data,printTime);
  stmt.finalize();
  messages.push({name:name, data:data, printTime:printTime});
}

io.on('connection', function (socket) {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data.message,
      printTime: data.printTime
    });
    //storeMessage
    storeMessage(socket.username,data.message,data.printTime);
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {

    //show latest messages
    messages.forEach(function (messages) {
      socket.emit('new message', {
        username: messages.name,
        message: messages.data,
        printTime: messages.printTime
      });
    })
    // we store the username in the socket session for this client
    socket.username = username;
    // add the client's username to the global list
    usernames[username] = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });

  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    // remove the username from global usernames list
    if (addedUser) {
      delete usernames[socket.username];
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });

  //when the client emits 'check login', check the validation of username and password
  socket.on('check login',function(data){
    var flag = 0;//means no such user
    console.log(data.name);
    console.log(data.psw);
    db.all("SELECT name,psw FROM user_info ORDER BY rowid", function(err, rows) {
        for(var i=0;i<rows.length;i++){
          if(rows[i].name == data.name){
            if(rows[i].psw == data.psw) {
              flag = 1;//means success
              //console.log('second if');
            }
            else flag = 2;//means wrong password
            break;
          }
        }
        //console.log(flag);
        socket.emit('check complete',flag);
    });

  });

  //when the client emits 'check signup', check the validation of username and password
  socket.on('check signup',function(data){
    var flag = false;//means no such user
    db.all("SELECT name,psw FROM user_info ORDER BY rowid", function(err, rows) {
      for(var i=0;i<rows.length;i++){
        if(rows[i].name == data.name){
          flag = true;//means already has the username
          break;
        }
      }
      if(flag == false){
        var stmt = db.prepare("INSERT INTO user_info VALUES (?,?)");
        stmt.run(data.name, data.psw);
        stmt.finalize();
      }
      socket.emit('check signup complete',flag);
    });

  });
});
