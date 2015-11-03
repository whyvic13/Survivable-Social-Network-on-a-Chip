var path = require('path');
var dbFile = path.join(__dirname, "./database.db");
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);

var numberOfPosts = 0;
var limit = 1000;

exports.startFromAPI = function(req, res, next) {
  var sqlstm = "SELECT * FROM publicChatTest";
  console.log(sqlstm);
  db.all(sqlstm, function(err, row){
    if (err) {
      console.log(err);
      res.json({"statusCode": 400, "message": "Bad request"});
    }else{
      console.log(row);
      numberOfPosts = row.length;
      if (row.length > limit) {
        deleteAllData();
      }
      console.log(numberOfPosts);
      next();
    }
  });
}

exports.startFromSocket = function() {
  var sqlstm = "SELECT * FROM publicChatTest";
  console.log(sqlstm);
  db.all(sqlstm, function(err, row){
    if (err) {
      console.log(err);
      return -1;
    }else{
      console.log(row);
      numberOfPosts = row.length;
      if (row.length > limit) {
        deleteAllData();
      }
      console.log(numberOfPosts);
      return numberOfPosts;
    }
  });
}

function deleteAllData(){
  db.all("DELETE FROM publicChatTest", function(err, row){
    if (err) {
      console.log(err);
    }else{
      console.log("All records deleted.");
      numberOfPosts = 0;
    }
  });
}

exports.getPublicMessages = function(req, res) {
  var sqlstm = "SELECT * FROM publicChatTest";
  console.log(sqlstm);
  db.all(sqlstm, function(err, row){
    if (err) {
      console.log(err);
      res.json({"statusCode": 400, "message": "Bad request"});
    }else{
      console.log(row);
      if (row.length > limit) {
        deleteAllData();
      }
      res.status(200).json({"statusCode": 200, "data": row});
    }
  });
}

exports.postPublicMessage = function(req, res) {
  var sqlstm = "INSERT INTO publicChatTest (message, sender, timestamp) VALUES (?, ?, ?)";
  console.log(sqlstm);
  var timestamp = req.body.timestamp;
  var message = req.body.message;
  var sender = req.body.sender;
  if (!timestamp) {
    timestamp = Math.floor(Date.now() / 1000);
  }
  db.serialize(function() {
    db.run(sqlstm, message, sender, timestamp);
    numberOfPosts ++;
    if (numberOfPosts > limit) {
      deleteAllData();
      console.log("Exceed " + limit + " posts.");
    }
  });
  res.status(200).json({"statusCode": 200});
}
