// Queries and returns a full list of users together with their online status
// This file should be merged with login and signup

var fs = require('fs');
var sqlite3 = require('sqlite3').verbose();
var dbfile = "database.db";
var path = require('path');
var dbfile = path.join(__dirname, "./database.db");

var dbExisted = false;

var db = new sqlite3.Database(dbfile, function(err) {
	if (!err) {
		dbExisted = true;
	}
});

// Returns a dictionary of {username: {online: 0 or 1, status: string}}
// If error occurs in database, return code 500

exports.getAllUsers = function(req, res, loggedInUsers) {
	if (dbExisted) {
		var usersDict = {};
		
		db.each("SELECT username, userStatus FROM users ORDER BY username COLLATE NOCASE", function(err, row) {
			if (err) {
				res.status(500).json({"statusCode": 500, "message": "Internal server error"});
				return false;
			}

			usersDict[row.username] = {};
			usersDict[row.username]['userStatus'] = row.userStatus;


			if (row.username in loggedInUsers) {
				usersDict[row.username]['online'] = 1;
			} else {
				usersDict[row.username]['online'] = 0;
			}
		}, function() { // called after db.each is completed
			res.set("Content-Type", "application/json");
			usersDict["statusCode"] = 200;
			console.log("usersDict:  ",usersDict);
			var jsonData = JSON.stringify(usersDict);
			res.status(200).send(jsonData);
		});
	} else {
		res.status(500).json({"statusCode": 500, "message": "Internal server error"});
	}
}
