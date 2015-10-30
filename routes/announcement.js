var path = require('path');
var dbFile = path.join(__dirname, "./database.db");
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);

exports.getAnnouncements = function(req, res) {
  var sqlstm = "SELECT * FROM announcements";
  console.log(sqlstm);
  db.all(sqlstm, function(err, row){
    if (err) {
      console.log(err);
      res.json({"statusCode": 400, "message": "Bad request"});
    }else{
      console.log(row);
      res.status(200).json({"statusCode": 200, "data": row});
    }
  });
}

exports.postAnnouncement = function(req, res) {
  insertAnnoucementSql(req.body.message, req.body.sender, req.body.timestamp);
  res.status(200).json({"statusCode": 200});
}

exports.insertAnnoucement = function(message, sender, timestamp){
  insertAnnoucementSql(message, sender, timestamp);
}

function insertAnnoucementSql(message, sender, timestamp){
  var sqlstm = "INSERT INTO announcements (message, sender, timestamp) VALUES (?, ?, ?)";
  console.log(sqlstm);
  if (!timestamp) {
    timestamp = Math.floor(Date.now() / 1000);
  }
  // var timestamp = Math.floor(Date.now() / 1000);
  db.serialize(function() {
    db.run(sqlstm, message, sender, timestamp);
  });
}
