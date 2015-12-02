if (global.IS_TEST) {
  dbfile = ':memory:';
} else {
  dbfile = './routes/database.db';
}

var sqlite3 = require('sqlite3').verbose();
var db;


var init = function(callback) {
  db.serialize(function() {
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, userStatus TEXT, level TEXT DEFAULT 'Citizen', accountStatus TEXT DEFAULT 'active')");
    db.run("CREATE TABLE IF NOT EXISTS publicChat (id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT, message TEXT, type TEXT, timestamp INTEGER, senderStatus TEXT, senderLocation TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS announcements (id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT, message TEXT, timestamp INTEGER)");
    db.run("CREATE TABLE IF NOT EXISTS privateChat (id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT, receiver TEXT, message TEXT, type TEXT, timestamp INTEGER, senderStatus TEXT, senderLocation TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS publicChatTest (id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT, message TEXT, timestamp INTEGER, senderStatus TEXT, senderLocation TEXT)",
      function() {
        var sqlstm = "SELECT * FROM users WHERE username='SSNAdmin'";
        db.get(sqlstm, function(err, row){
          if (err) {
            //console.log(err);
          } else {
            if (!row) {
              db.run("INSERT into users (username, password, level, userStatus) VALUES (?, ?, ?, ?)", "SSNAdmin", "admin", "Administrator", "OK");
            }
          }
        });

        db.existed = true;
        if (callback) {
          callback();
        }
      });
  });
}



var configure = function(filename) {
  db = new sqlite3.Database(filename, function(err) {
  	if (!err) {
  		init();
  	}
  });
  return db;
}



var drop = function(callback) {
  db.serialize(function() {
    db.run("DROP TABLE IF EXISTS users");
    db.run("DROP TABLE IF EXISTS publicChat");
    db.run("DROP TABLE IF EXISTS announcements");
    db.run("DROP TABLE IF EXISTS privateChat");
    db.run("DROP TABLE IF EXISTS publicChatTest", callback);
  });
}

configure(dbfile);
db.drop = drop;
db.init = init;

module.exports = db;