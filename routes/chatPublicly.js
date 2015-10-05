var path = require('path');
var dbFile = path.join(__dirname, "./publicChat.db");
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);

exports.getPublicMessages = function(req, res) {
  var sqlstm = "SELECT * FROM publicChat WHERE timestamp <= " + req.query.start + " LIMIT 20"
  console.log(sqlstm);
  db.all(sqlstm, function(err, row){
    if (err) {
      console.log(err);
      res.status(400).end("Bad request");
    }else{
      console.log(row);
      res.status(200).json(row);
    }
  });
}
