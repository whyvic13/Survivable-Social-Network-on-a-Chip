// Gets public chat records during a specified amount of time

var app = require('express')();
var server = require('http').createServer(app);
var fs = require('fs');
var sqlite3 = require('sqlite3').verbose();
var dbfile = "database.db";
var dbExisted = false;

var db = new sqlite3.Database(dbfile, function(err) {
	if (!err) {
		db.serialize(function() {
			db.run("CREATE TABLE IF NOT EXISTS publicChat (sender TEXT, message TEXT, timestamp INTEGER, sentStatus TEXT, sentLocation TEXT)");
		});
		dbExisted = true;
	}
});

/*db.serialize(function() {
	console.log("in database");
	db.run("INSERT into publicChat (sender, message, timestamp, sentStatus, sentLocation)" +" VALUES (?, ?, ?, ?, ?)", "nga", "message", 1443990991, "", "");
	db.run("INSERT into publicChat (sender, message, timestamp, sentStatus, sentLocation)" +" VALUES (?, ?, ?, ?, ?)", "javaa", "message", 1443990989, "", "");
	db.run("INSERT into publicChat (sender, message, timestamp, sentStatus, sentLocation)" +" VALUES (?, ?, ?, ?, ?)", "nga", "message", 1443990900, "", "");		
});*/

// Returns a record of public chat messages and attributes 
// from {startTime} to {endTime}
// If user not logged in, returns code 400
// Parameters must be in UNIX time format. If not returns code 400
// If error occurs in the database, returns code 500
var loggedInUsers = { "nga": true }; // for unit test only, delete when intergrate
app.get('/getPublicMessages', function(req, res) {
	username = req.query.username;
	start = parseInt(req.query.startTime);
	end = parseInt(req.query.endTime);

	// Checks for correct params
	var validStart = !(isNaN(start)) && start >= 0;
	var validEnd = !(isNaN(end)) && end >= 0;
	if (!(username in loggedInUsers) || !validStart || !validEnd) {
		res.sendStatus(400);
		return false;
	}

	// Queries data
	var publicChatData = [];
	if (dbExisted) {
		var command = "SELECT * FROM publicChat WHERE timestamp BETWEEN " + start + " AND " + end;
		db.each(command, function(err, row) {
			if (err) {
				res.sendStatus(500);
				return false;
			}

			var item = {
				"message": row.message,
				"sender": row.sender,
				"timestamp": row.timestamp,
				"senttatus": row.sentStatus,
				"sentLocation": row.sentLocation
			};

			publicChatData.push(item);
			//console.log(item);
		}, function() { // called after db.each is completed
			res.set("Content-Type", "application/json");
			var jsonData = JSON.stringify(publicChatData);
			res.status(200).send(jsonData);
		});
	} else {
		res.sendStatus(500);
	}
});


/*function convertTimestamp(timestamp) {
	var date = new Date(timestamp * 1000);
	var year = date.getFullYear();
	var month = date.getMonth();
	var day = date.getDate();
	var hrs = date.getHours();
	var mins = date.getMinutes();
	var secs = date.getSeconds();
	return hrs + ":" + mins + ":" + secs + " " + month + "/" + day + "/" + year;
}*/


server.listen(8080);