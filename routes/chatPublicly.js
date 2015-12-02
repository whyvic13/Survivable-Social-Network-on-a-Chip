var path = require('path');
var db = require('./database');
var fs = require('fs');
var commonWordsFile = path.join(__dirname, "./common-english-words.json");
var commonWords = JSON.parse(fs.readFileSync(commonWordsFile, 'utf8'));

exports.getPublicMessages = function(req, res) {
  if(req.query.ID <= 1){
    res.json({"statusCode": 401, "message": "No more history messages!"});
  }
  else{
    var sqlstm = "SELECT * FROM publicChat WHERE timestamp <= " + req.query.start + " AND id < "+req.query.ID+" ORDER BY id DESC LIMIT 20";
    db.serialize(function() {
      db.all(sqlstm, function(err, row){
        if (err) {
          res.json({"statusCode": 400, "message": "Bad request"});
        }else{
          if(row.length !== 0){
            row.reverse();
            res.status(200).json({"statusCode": 200, "data": row, "newtime": row[0].timestamp, "newID": row[0].id});
          }
          else{
            res.json({"statusCode": 401, "message": "No history messages!"});
          }
        }
      });
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

  var sqlstm = "SELECT * FROM publicChat WHERE (";
  var fields = ['message'];
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

  sqlstm = sqlstm + wordsToSql + ") AND id < " + req.query.id + " COLLATE NOCASE ORDER BY id DESC LIMIT 10"

  db.serialize(function() {
    db.all(sqlstm, function(err, row){
      if (err) {
        res.json({"statusCode": 400, "message": "Bad request"});
        return;
      }else{
        if(row.length !== 0){
          res.status(200).json({"statusCode": 200, "data": row});
        }
        else{
          res.json({"statusCode": 401, "message": "No matched results"});
        }
      }
    });
  });
}
