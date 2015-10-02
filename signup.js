// Process signup function
// Checks if the user existed and returns a success/error code 

var app = require('express')();
var server = require('http').createServer(app);
var fs = require('fs');
var sqlite3 = require('sqlite3').verbose();
var dbfile = "database.db";
var existed = fs.existsSync(dbfile);
var bodyParser = require('body-parser');
var db = new sqlite3.Database(dbfile);

// Initializes database
db.serialize(function() {
	if (!existed) {
		db.run('CREATE TABLE users (user TEXT, password TEXT)');
	}
});


// Gets info from signup page
// Returns the signup status code to imply types of success or failure
app.use(bodyParser.json()); // support JSON-encoded bodies
app.use(bodyParser.urlencoded( { // support URL-encoded bodies
	extended: true,
}));

app.post('/register', function(req, res) {
	var username = req.body.username;
	var password = req.body.password;
	checkUserExisted(res, username, password);
});


// Checks if users existed 
// If not: creates new user in database, returns code 204
// If existed and correct password: returns code 200
// If existed and incorrect password: returns error code 401
// If cannot query database: returns error code 500
function checkUserExisted(res, username, password) {
	db.serialize(function() {
		if (existed) {
			db.get("SELECT * FROM users WHERE user=" + escape(username), function(err, row) {
				if (err) {
					res.status(500).send("Internal Server Error"); 
				}

				if (row === undefined) { // empty result
					db.run("INSERT into users (user, password) VALUES (?, ?)",
						username, password);
						res.status(204).send("New Account Created");
				} else {
					if (row.password === password) {
						res.status(200).send("OK");
					} else {
						res.status(401).send("Unauthorized");
					}
				}
			});
		}	
	});
}


server.listen(8080);
//module.exports = app;