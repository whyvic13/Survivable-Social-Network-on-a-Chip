var path = require('path');
var dbFile = path.join(__dirname, "./database.db");
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);

function inserMessageSql(sender, receiver, message, senderStatus, timestamp){
  var sqlstm = "INSERT INTO privateChat (sender, receiver, message, senderStatus, timestamp) VALUES (?, ?, ?, ?, ?)";
  console.log(sqlstm);
  if (!timestamp) {
    timestamp = Math.floor(Date.now() / 1000);
  }
  // var timestamp = Math.floor(Date.now() / 1000);
  db.serialize(function() {
    db.run(sqlstm, sender, receiver, message, senderStatus, timestamp);
  });
}

exports.postAPrivateMessage = function(req, res){
  inserMessageSql(req.body.sender, req.body.receiver, req.body.message, req.body.senderStatus,  req.body.timestamp);
  res.status(200).json({"statusCode": 200});
}

exports.insertMessage = function(sender, receiver, message, senderStatus, timestamp){
  console.log("s: ",sender);
  console.log("r: ",receiver);
  inserMessageSql(sender, receiver, message, senderStatus, timestamp);
}

exports.getPrivateMessagesBetween = function(req, res){
  var sender = req.query.sender;
  var receiver = req.query.receiver;
  console.log(req.query);
  var sqlstm = "SELECT * FROM privateChat AS msg WHERE (msg.sender='" + sender + "' AND msg.receiver='" + receiver + "') OR (msg.sender='" + receiver + "' AND msg.receiver='" + sender +"')";
  console.log(sqlstm);
  db.all(sqlstm, function(err, row){
    if (err) {
      console.log(err);
      res.json({"statusCode": 400, "message": "Bad request"});
      return;
    }else{
      console.log(row);
      res.status(200).json({"statusCode": 200, "data": row});
      return row;
    }
  });
}
