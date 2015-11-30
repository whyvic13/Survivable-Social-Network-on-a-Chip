var fs = require('fs');
var sqlite3 = require('sqlite3').verbose();
var dbfile = "database.db";
var path = require('path');
var dbFile = path.join(__dirname, "./database.db");
var db = new sqlite3.Database(dbFile);

exports.getProfileList = function(req, res){
  if (req.user.level == "Administrator") {
    var sqlstm = "SELECT username, password, level, accountStatus FROM users";
    console.log(sqlstm);
    db.all(sqlstm, function(err, rows){
      if (err) {
        console.log(err);
        res.json({"statusCode": 400, "message": "Bad request"});
      }else{
        console.log(rows);
        res.status(200).json({"statusCode": 200, "data": rows});
      }
    });
  }else {
    res.status(401).json({"statusCode": 401, "message": "Unauthorized"});
  }
}

exports.updateUserProfile = function(req, res, next){
  if (req.user.level == "Administrator") {
    if (qualifiedUsernamePassword(req.body.newUsername, req.body.password)) {
      db.get("SELECT * FROM users WHERE username='" + req.body.newUsername + "'", function(err, row){
        if (err) {
          console.log(err);
          res.json({"statusCode": 500, "message": "Internal server error"});
        }else{
          if (!(row === undefined) && req.body.newUsername != req.body.oldUsername) {
            res.json({"statusCode": 401, "message": "Username already existed"});
          }else{
            var sqlstm = "UPDATE users SET username='" + req.body.newUsername + "', password='" + req.body.password + "', level='" + req.body.level + "', accountStatus='" + req.body.accountStatus + "' WHERE username='" + req.body.oldUsername + "'";
            console.log(sqlstm);
            db.run(sqlstm, function(err){
              if (err) {
                console.log(err);
                res.json({"statusCode": 500, "message": "Internal server error"});
              }else{
                // res.status(200).json({"statusCode": 200});
                if (req.body.accountStatus == "inactive") {
                  req.accountStatusChanged = req.body.newUsername;
                }
                next();
              }
            });
          }
        }
      });
    }else{
      res.json({"statusCode": 401, "message": "Username or password should follow the rules"});
    }
  }else {
    res.status(401).json({"statusCode": 401, "message": "Unauthorized"});
  }
}


var bannedUsersDict = {}; // a dictionary of banned users
parseBannedUsers();

// Checks if username and password comply with the requirements, return a boolean value
// Usrename must have >= 3 characters and not in the list
// http://blog.postbit.com/reserved-username-list.html
// Password must have >= 4 characters
function qualifiedUsernamePassword(username, password) {
	if (username.length < 3 || password.length < 4 || username in bannedUsersDict) {
		return false;
	}
	return true;
}


// Parses the banned users text file into a dictionary
function parseBannedUsers() {
	var file = path.join(__dirname, "./bannedUsers.txt");
	fs.readFile(file, "utf8", function (err, data) {
		bannedList = data.split(/\s+/);
		for (var i = 0; i < bannedList.length; i++) {
			bannedUsersDict[bannedList[i]] = true;
		}
	});
}
