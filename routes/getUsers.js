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

// Returns a list of all users and their online status
// 0: offline, 1: online
// If error occurs in database, return code 500

exports.getAllUsers = function(req, res, loggedInUsers) {
	if (dbExisted) {
		var usersDict = {};
		db.each("SELECT username FROM users", function(err, row) {
			if (err) {
				res.status(500).json({"statusCode": 500, "message": "Internal server error"});
				return false;
			}

			console.log(loggedInUsers);

			if (row.username in loggedInUsers) {
				usersDict[row.username] = 1;
			} else {
				usersDict[row.username] = 0;
			}
		}, function() { // called after db.each is completed
			res.set("Content-Type", "application/json");
			usersDict["statusCode"] = 200;
			var jsonData = JSON.stringify(usersDict);
			res.status(200).send(jsonData);
		});
	} else {
		res.status(500).json({"statusCode": 500, "message": "Internal server error"});
	}
}
