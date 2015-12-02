// Queries and returns a full list of users together with their online status
// This file should be merged with login and signup

var fs = require('fs');
var db = require('./database');

// Returns a dictionary of {username: {online: 0 or 1, status: string}}
// If error occurs in database, return code 500

exports.getAllUsers = function(req, res, loggedInUsers) {
	db.serialize(function() {
		var usersDict = {};

		db.each("SELECT username, userStatus FROM users WHERE accountStatus='active' ORDER BY username COLLATE NOCASE", function(err, row) {
			if (err) {
				res.status(500).json({"statusCode": 500, "message": "Internal server error"});
				return false;
			}

			usersDict[row.username] = {};
			usersDict[row.username]['userStatus'] = row.userStatus;
			usersDict[row.username]['level'] = row.level;

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
	});
}

/*exports.searchUsers = function(req, res, loggedInUsers) {
	if (dbExisted) {
		var usersDict = {};
		var dbStatement = "SELECT username, userStatus FROM users WHERE accountStatus='active' AND username LIKE '%" + req.query.username + "%' COLLATE NOCASE ORDER BY username";
		console.log(dbStatement);
		db.each(dbStatement, function(err, row) {
			if (err) {
				console.log(err);
				res.status(500).json({"statusCode": 500, "message": "Internal server error"});
				return false;
			}
			console.log(row);
			usersDict[row.username] = {};
			usersDict[row.username]['userStatus'] = row.userStatus;

			if (row.username in loggedInUsers) {
				usersDict[row.username]['online'] = 1;
			} else {
				usersDict[row.username]['online'] = 0;
			}
		}, function() { // called after db.each is completed
			if (Object.keys(usersDict).length == 0) {
				res.json({"statusCode": 401, "message": "No matched result"});
				return;
			}
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

exports.showUsersByStatus = function(req, res, loggedInUsers) {
	if (dbExisted) {
		var usersDict = {};
		var dbStatement = "SELECT username, userStatus FROM users WHERE accountStatus='active' AND userStatus='" + req.query.status + "' ORDER BY username";
		db.each(dbStatement, function(err, row) {
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
			if (Object.keys(usersDict).length == 0) {
				res.json({"statusCode": 401, "message": "No matched result"});
				return;
			}
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
*/