// Queries and returns a full list of users together with their online status
// This file should be merged with login and signup

var app = require('express')();
var server = require('http').createServer(app);
var fs = require('fs');
var sqlite3 = require('sqlite3').verbose();
var dbfile = "database.db";

var dbExisted = false;

var db = new sqlite3.Database(dbfile, function(err) {
	if (!err) {
		dbExisted = true;
	}
});

// Returns a list of all users and their online status
// 0: offline, 1: online
// If error occurs in database, return code 500
var loggedInUsers = {}; // for unit test only, delete when intergrate
app.get('/users', function(req, res) {
	if (dbExisted) {
		var usersDict = {};

		db.each("SELECT user FROM users", function(err, row) {
			if (err) {
				res.sendStatus(500);
				return false;
			}

			if (row.user in loggedInUsers) {
				usersDict[row.user] = 1;
			} else {
				usersDict[row.user] = 0;
			}
		}, function() { // called after db.each is completed
			res.set("Content-Type", "application/json");
			var jsonData = JSON.stringify(usersDict);
			res.status(200).send(jsonData);
		});
	} else {
		res.sendStatus(500);
	}
});


server.listen(8080);
