// Process signup function
// Checks if the user existed and returns a success/error code

var fs = require('fs');
var sqlite3 = require('sqlite3').verbose();
var path = require('path');
var dbfile = path.join(__dirname, "./database.db");

var db = new sqlite3.Database(dbfile);

var bannedUsersDict = {}; // a dictionary of banned users
parseBannedUsers();


// Gets info from signup page
// Returns the signup status code to imply types of success or failure
exports.register = function(req, res, next) {
	var username = req.body.username;
	var password = req.body.password;
	//console.log(username);
	//console.log(password);
	if (!qualifiedUsernamePassword(username, password)) {
		response(req, res, 401, username, "Username and/or password does not meet requirements", next);
	} else {
		checkUserExisted(req, res, username, password, next);
	}
}



// Sends response with statusCode, username and statusMessage
function response(req, res, statusCode, username, mess, next) {
	res.set("Content-Type", "application/json");

	var jsonData = JSON.stringify({
		"statusCode": statusCode,
		"username": username,
		"statusMessage": mess,
		"statusCode": statusCode
	});
	res.status(200).send(jsonData);

}


// Checks if users existed
// If not: creates new user in database, returns code 201
// If existed and correct password: adds to loggedInUsers list, returns code 200
// If existed and incorrect password: returns error code 401
// If cannot query database: returns error code 500
// var loggedInUsers = {}; // for unit test only, delete when intergrate
function checkUserExisted(req, res, username, password, next) {
	db.serialize(function() {
		if (dbExisted) {
			db.get("SELECT * FROM users WHERE username='" + username +"'", function(err, row) {
				if (err) {
					response(req, res, 500, username, "Internal server error", next);
					return;
				}

				if (row === undefined) { // empty result
					db.run("INSERT into users (username, password) VALUES (?, ?)",
						username, password);
						// response(req, res, 201, username, "New user created", next);
						req.statusCode = 201;
						next();
				} else if (row.password === password) {
					// loggedInUsers[username] = true;
					// response(req, res, 200, username, "OK", next);
					req.statusCode = 200;
					next();
				} else {
					response(req, res, 401, username, "Unauthorized", next);
				}
			});
		} else {
			response(req, res, 500, username, "Internal server error", next);
			//console.log("database not existed");
		}
	});
}


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
