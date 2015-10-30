var path = require('path');
var dbFile = path.join(__dirname, "./database.db");
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);

exports.getPublicMessages = function(req, res) {
  console.log("start time: "+req.query.start);
  if(req.query.ID <= 1){
    res.json({"statusCode": 401, "message": "No more history messages!"});
  }
  else{
    var sqlstm = "SELECT * FROM publicChat WHERE timestamp <= " + req.query.start + " AND id < "+req.query.ID+" ORDER BY id DESC LIMIT 20";
    console.log(sqlstm);

    db.all(sqlstm, function(err, row){
      if (err) {
        console.log(err);
        res.json({"statusCode": 400, "message": "Bad request"});
      }else{
        if(row.length !== 0){
          row.reverse();
          console.log(row);
          console.log(row[0].timestamp);
          res.status(200).json({"statusCode": 200, "data": row, "newtime": row[0].timestamp, "newID": row[0].id});
        }
        else{
          res.json({"statusCode": 401, "message": "No history messages!"});
        }
      }
    });
  }
}
