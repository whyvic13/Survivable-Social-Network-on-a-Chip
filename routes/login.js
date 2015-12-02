var path = require('path');
var db = require('./database');

/*exports.findById = function(id, cb) {
  console.log("findbyid: " + id);
  var sqlstm = "SELECT * FROM users WHERE id=" + id + " AND accountStatus='active'"
  console.log(sqlstm);
  console.log("---");
  db.get(sqlstm, function(err, row){
    if (err) {
      console.log(err);
      cb(new Error(err));
    }else{
      if (row) {
        console.log("result");
        console.log(row);
        console.log("---");
        cb(null, row);
      }else{
        console.log("Not found")
        cb(new Error('User ' + id + ' does not exist'));
      }
    }
  })
}*/

exports.findByUsername = function(username, cb) {
  var sqlstm = "SELECT * FROM users WHERE username='" + username + "' AND accountStatus='active'"
  db.serialize(function() {
    db.get(sqlstm, function(err, row){
      if (err) {
        return cb(null, null);
      }else{
        if (row) {
          //console.log(row);
          return cb(null, row);
        }else{
          return cb(null, null);
        }
      }
    });
  });
}

exports.checkLogin = function(req, res, next, loggedInUsers, isTesting) {
  if (req.user && loggedInUsers[req.user.username] && req.user.accountStatus == "active") {
    if (isTesting) {
      res.json({"statusCode": 401, "message": "Test is running."});
    }else {
      next();
    }
  }else {
    res.status(401).end("Unauthorized");
  }
}
