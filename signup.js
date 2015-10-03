// Process signup function
// Checks if the user existed and returns a success/error code 

var app = require('express')();
var server = require('http').createServer(app);
var fs = require('fs');
var sqlite3 = require('sqlite3').verbose();
var dbfile = "database.db";
var dbExisted = false;


var bodyParser = require('body-parser');
var db = new sqlite3.Database(dbfile, function(err) {
	if (!err) {
		db.serialize(function() {
			db.run("CREATE TABLE IF NOT EXISTS users (user TEXT, password TEXT)");
		});
		dbExisted = true;
	}
});

var bannedUsersDict = {}; // a dictionary of banned users
parseBannedUsers();


app.use(bodyParser.json()); // support JSON-encoded bodies
app.use(bodyParser.urlencoded( { // support URL-encoded bodies
	extended: true,
}));


// Gets info from signup page
// Returns the signup status code to imply types of success or failure
app.post('/register', function(req, res) {
	var username = req.body.username;
	var password = req.body.password;
	//console.log(username);
	//console.log(password);
	if (!qualifiedUsernamePassword(username, password)) {
		response(res, 401, username, "Username and/or password does not meet requirements");
	} else {
		checkUserExisted(res, username, password);
	}
});


// Sends response with statusCode, username and statusMessage
function response(res, statusCode, username, mess) {
	res.set("Content-Type", "application/json");
	var jsonData = JSON.stringify({
		"username": username,
		"statusMessage": mess
	});
	res.status(statusCode).send(jsonData);
}


// Checks if users existed 
// If not: creates new user in database, returns code 201
// If existed and correct password: adds to loggedInUsers list, returns code 200
// If existed and incorrect password: returns error code 401
// If cannot query database: returns error code 500
var loggedInUsers = {}; // for unit test only, delete when intergrate
function checkUserExisted(res, username, password) {
	db.serialize(function() {
		if (dbExisted) {
			db.get("SELECT * FROM users WHERE user='" + username +"'", function(err, row) {
				if (err) {
					response(res, 500, username, "Internal server error");
					return;
				}

				if (row === undefined) { // empty result
					db.run("INSERT into users (user, password) VALUES (?, ?)",
						username, password);
						response(res, 201, username, "New user created");
				} else if (row.password === password) {
					loggedInUsers[username] = true;
					response(res, 200, username, "OK");
				} else {
					response(res, 401, username, "Unauthorized");
				}
			});
		} else {
			response(res, 500, username, "Internal server error");
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
	fs.readFile("bannedUsers.txt", "utf8", function (err, data) {
		bannedList = data.split(/\s+/);
		for (var i = 0; i < bannedList.length; i++) {
			bannedUsersDict[bannedList[i]] = true;
		}
	});
}


server.listen(8080);
//module.exports = app;
