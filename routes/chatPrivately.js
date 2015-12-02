var path = require('path');
var db = require('./database');
var fs = require('fs');
var commonWordsFile = path.join(__dirname, "./common-english-words.json");
var commonWords = JSON.parse(fs.readFileSync(commonWordsFile, 'utf8'));

function inserMessageSql(sender, receiver, message, senderStatus, timestamp, type){
  var sqlstm = "INSERT INTO privateChat (sender, receiver, message, senderStatus, timestamp, type) VALUES (?, ?, ?, ?, ?, ?)";
  if (!timestamp) {
    timestamp = Math.floor(Date.now() / 1000);
  }
  // var timestamp = Math.floor(Date.now() / 1000);
  db.serialize(function() {
    db.run(sqlstm, sender, receiver, message, senderStatus, timestamp, type);
  });
}

/*exports.postAPrivateMessage = function(req, res){
  inserMessageSql(req.body.sender, req.body.receiver, req.body.message, req.body.senderStatus,  req.body.timestamp);
  res.status(200).json({"statusCode": 200});
}*/

exports.insertMessage = function(sender, receiver, message, senderStatus, timestamp, type){
  inserMessageSql(sender, receiver, message, senderStatus, timestamp, type);
}

exports.getPrivateMessagesBetween = function(req, res){
  var sender = req.query.sender;
  var receiver = req.query.receiver;
  var sqlstm = "SELECT * FROM privateChat AS msg WHERE (msg.sender='" + sender + "' AND msg.receiver='" + receiver + "') OR (msg.sender='" + receiver + "' AND msg.receiver='" + sender +"')";
  db.serialize(function() {
    db.all(sqlstm, function(err, row){
      if (err) {
        res.json({"statusCode": 400, "message": "Bad request"});
        return;
      }else{
        res.status(200).json({"statusCode": 200, "data": row});
        return row;
      }
    });
  });
}

exports.searchPrivateMessages = function(req, res) {

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

  var sqlstm = "SELECT * FROM privateChat WHERE (";
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

  sqlstm = sqlstm + wordsToSql + ") AND ((sender='" + req.query.sender + "' AND receiver='" + req.query.receiver + "') OR (sender ='" + req.query.receiver + "' AND receiver='" + req.query.sender + "')) AND id < " + req.query.id + " COLLATE NOCASE ORDER BY id DESC LIMIT 10"

  db.serialize(function() {
    db.all(sqlstm, function(err, row){
      if (err) {
        res.json({"statusCode": 400, "message": "Bad request"});
        return;
      }else{
        if(row.length !== 0){
          //row.reverse();
          //console.log(row[0].timestamp);
          res.status(200).json({"statusCode": 200, "data": row});
        }
        else{
          res.json({"statusCode": 401, "message": "No matched results"});
        }
      }
    });
  });
}
