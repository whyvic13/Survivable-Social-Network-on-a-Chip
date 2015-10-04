var path = require('path');
var dbFile = path.join(__dirname, "./database.db");
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);

// var Strategy = require('passport-local').Strategy;
// var passport = require('passport');
//
// passport.use(new Strategy(
//   function(username, password, cb) {
//     login.findByUsername(username, function(err, user) {
//       if (err) { return cb(err); }
//       if (!user) { return cb(null, false); }
//       if (user.password != password) { return cb(null, false); }
//       return cb(null, user);
//     });
//   }));
//
// passport.serializeUser(function(user, cb) {
//   	cb(null, user.id);
// });
//
// passport.deserializeUser(function(id, cb) {
// 	console.log("deserializer: " + id);
//   login.findById(id, function (err, user) {
//     if (err) { return cb(err); }
//     cb(null, user);
//   });
// });

exports.findById = function(id, cb) {
  console.log("findbyid: " + id);
  var sqlstm = "SELECT id, username FROM users WHERE id=" + id + ""
  console.log(sqlstm);
  console.log("---");
  db.get(sqlstm, function(err, row){
    if (err) {
      console.log(err);
      cb(new Error(err));
    }else{
      if (row) {
        console.log("result");
        console.log(row);
        console.log("---");
        cb(null, row);
      }else{
        console.log("Not found")
        cb(new Error('User ' + id + ' does not exist'));
      }
    }
  })
}

exports.findByUsername = function(username, cb) {
  var sqlstm = "SELECT * FROM users WHERE username='" + username + "'"
  db.get(sqlstm, function(err, row){
    if (err) {
      console.log(err);
      return cb(null, null);
    }else{
      if (row) {
        console.log(row);
        return cb(null, row);
      }else{
        console.log("Not found");
        return cb(null, null);
      }
    }
  });
}
