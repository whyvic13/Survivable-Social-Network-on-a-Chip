var path = require('path');
var dbFile = path.join(__dirname, "./database.db");
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);
var fs = require('fs');
var commonWordsFile = path.join(__dirname, "./common-english-words.json");
var commonWords = JSON.parse(fs.readFileSync(commonWordsFile, 'utf8'));

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

exports.searchPublicMessages = function(req, res) {

  var keywords = req.query.keywords;
  var words = keywords.split(' ');
  var stop = true;
  for (var i = 0; i < words.length; i++) {
    if (!(words[i] in commonWords)) {
      stop = false;
      break;
    }
  }

  if (stop) {
    res.json({"statusCode": 400, "message": "Keywords should not all be stop words."});
    return;
  }

  var sqlstm = "SELECT * FROM publicChat WHERE ";
  var fields = ['sender', 'message', 'timestamp', 'senderStatus', 'senderLocation'];
  wordsToSql = "";
  for (var i = 0; i < fields.length; i++) {
    if (i > 0) {
      wordsToSql += "OR ";
    }
    wordsToSql += "(";
    for (var j = 0; j < words.length; j++) {
      if (j > 0) {
        wordsToSql += " AND "
      }
      wordsToSql += fields[i] +  " LIKE '%" + words[j] + "%'";
    }
    wordsToSql += ") ";
  }

  sqlstm = sqlstm + wordsToSql + "COLLATE NOCASE ORDER BY id DESC "

  console.log(sqlstm);

  db.all(sqlstm, function(err, row){
    if (err) {
      console.log(err);
      res.json({"statusCode": 400, "message": "Bad request"});
      return;
    }else{
      if(row.length !== 0){
        //row.reverse();
        console.log(row);
        //console.log(row[0].timestamp);
        res.status(200).json({"statusCode": 200, "data": row});
      }
      else{
        res.json({"statusCode": 401, "message": "No matched results"});
      }
    }
  });
}
