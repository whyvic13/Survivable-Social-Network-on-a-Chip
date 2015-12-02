global.IS_TEST = true;

var assert = require("assert");
var io = require('socket.io-client');
var db = require('../routes/database');
var app = require('../app');
var fs = require('fs');
//var filePath = './test.db';

beforeEach(function (done) {
  db.drop(function() {
    db.init(done);
  });
});



it('should response 401, password length invalid', function(done) {
  var request = require('supertest');
  var express = require('express');

  request(app)
  .post('/user/signup')
  .send({"username":"fkjf", "password":"123"})
  .expect(function (response) {
    assert.equal(401, response.body.statusCode);
  })
  .end(done);
});



it('should respond 201, create new user', function(done) {
  var request = require('supertest');
  var express = require('express');

  request(app)
  .post('/user/signup')
  .send({"username":"abcd7890", "password":"1234"})
  .expect(function (response) {
    assert.equal(201, response.body.statusCode);
  })
  .end(done);
});



it('should respond 200, successful login', function(done) {
  var request = require('supertest');
  var express = require('express');

  request(app)
      // Sign up
      .post('/user/signup')
      .send({"username":"aaaa", "password":"aaaa"})
      .expect(200, function() {
        request(app)
          // Login
          .post('/user/login')
          .send({"username":"aaaa", "password":"aaaa"})
          .expect(function (response) {
            assert.equal(200, response.body.statusCode);
          })
          .end(done);
        });
});



it('should respond 200, successful logout', function(done) {
  var agent = require('supertest').agent(app);

  agent
      // Sign up
      .post('/user/signup')
      .send({"username":"aaaa", "password":"aaaa"})
      .expect(200, function() {
        agent
          .get('/user/logout')
          .expect(200)
          .end(done);
      });
});



it('get users: should return status code 200', function(done) {
  var agent = require('supertest').agent(app);

  agent
    .post('/user/signup')
    .send({"username":"aaaa", "password":"aaaa"})
    .expect(200, function() {
      agent
        .get('/users')
        .expect(200)
        .end(done);
    });
});



it('get users: should return status code 401', function(done) {
  var agent = require('supertest').agent(app);

  agent
    .get('/users')
    .expect(401)
    .end(done);
});



it('get public messages: should return status code 200', function(done) {
  var agent = require('supertest').agent(app);

  agent
    .post('/user/signup')
    .send({"username":"aaaa", "password":"aaaa"})
    .expect(200, function() {
      agent
        .get('/getPublicMessages')
        .expect(200)
        .end(done);
    });
});



it('get public messages: should return status code 401', function(done) {
  var agent = require('supertest').agent(app);

  agent
    .get('/getPublicMessages')
    .expect(401)
    .end(done);
});



it('search public messages: should return status code 200', function(done) {
  var agent = require('supertest').agent(app);

  agent
    .post('/user/signup')
    .send({"username":"aaaa", "password":"aaaa"})
    .expect(200, function() {
      agent
        .get('/searchPublicMessages?keywords=abc')
        .expect(200)
        .end(done);
    });
});



it('search public messages: should return status code 401', function(done) {
  var agent = require('supertest').agent(app);

  agent
    .get('/searchPublicMessages?keywords=abc')
    .expect(401)
    .end(done);
});



it('get announcement: should return status code 200', function(done) {
  var agent = require('supertest').agent(app);

  agent
    .post('/user/signup')
    .send({"username":"aaaa", "password":"aaaa"})
    .expect(200, function() {
      agent
        .get('/getAnnoucements')
        .expect(200)
        .end(done);
    });
});



it('get announcement: should return status code 401', function(done) {
  var agent = require('supertest').agent(app);

  agent
    .get('/getAnnoucements')
    .expect(401)
    .end(done);
});


it('search announcement: should return status code 200', function(done) {
  var agent = require('supertest').agent(app);

  agent
    .post('/user/signup')
    .send({"username":"aaaa", "password":"aaaa"})
    .expect(200, function() {
      agent
        .get('/searchAnnouncements?keywords=abc')
        .expect(200)
        .end(done);
    });
});



it('search announcement: should return status code 401', function(done) {
  var agent = require('supertest').agent(app);

  agent
    .get('/searchAnnouncements?keywords=abc')
    .expect(401)
    .end(done);
});



it('get private messages: should return status code 200', function(done) {
  var agent = require('supertest').agent(app);

  agent
    .post('/user/signup')
    .send({"username":"aaaa", "password":"aaaa"})
    .expect(200, function() {
      agent
        .get('/getPrivateMessages?sender=aaaa&receiver=bbbb')
        .expect(200)
        .end(done);
    });
});



it('get private messages: should return status code 401', function(done) {
  var agent = require('supertest').agent(app);

  agent
    .get('/getPrivateMessages?sender=aaaa&receiver=bbbb')
    .expect(401)
    .end(done);
});



it('search private messages: should return status code 200', function(done) {
  var agent = require('supertest').agent(app);

  agent
    .post('/user/signup')
    .send({"username":"aaaa", "password":"aaaa"})
    .expect(200, function() {
      agent
        .get('/searchPrivateMessages?sender=aaaa&receiver=bbbb&keywords=abc&id=100')
        .expect(200)
        .end(done);
    });
});



it('search private messages: should return status code 401', function(done) {
  var agent = require('supertest').agent(app);

  agent
    .get('/searchPrivateMessages?sender=aaaa&receiver=bbbb&keywords=abc&id=100')
    .expect(401)
    .end(done);
});


it('should response 401, wrong password', function(done) {
  var request = require('supertest');
  var express = require('express');

  request(app)
      // Sign up
      .post('/user/signup')
      .send({"username":"aaaa", "password":"aaaa"})
      .expect(401, function() {
        request(app)
          // Login
          .post('/user/login')
          .send({"username":"aaaa", "password":"dsalgj"})
          .expect(function (response) {
            assert.equal(200, response.body.statusCode);
          })
          .end(done);
        });
    });



var socketURL = 'http://localhost:3000';
var options = {
  transports: ['websocket'],
  'force new connection': true
};

it('should broadcast new status to all users', function(done) {
  var user1 = io.connect(socketURL, options);
  user1.on('connect', function(data) {
    var user2 = io.connect(socketURL, options);

    user2.on('connect', function(data) {
      user2.on('status update', function(emitData) {
        assert.equal(emitData.username, "daisy");
        assert.equal(emitData.userStatus, "help");
        done();
      });

      user1.emit('share status', {
        "username": "daisy",
        "userStatus": "help"
      });
    });
  });
});


it('should send public message to other users', function(done) {
  var user1 = io.connect(socketURL, options);
  user1.on('connect', function(data) {
    var user2 = io.connect(socketURL, options);
    var user3 = io.connect(socketURL, options);

    user2.on('connect', function(data) {
      user3.on('connect', function(data) {
        user2.emit('user join', "user2");
        user3.emit("user join", "user3");

        var cnt = 0;

        user2.on('new public message', function(emitData) {
          assert.equal(emitData.username, "daisy");
          assert.equal(emitData.senderStatus, "help");
          assert.equal(emitData.message, "i want to sleep");

          if (++cnt === 2) {
            done();
          }
        });

        user3.on('new public message', function(emitData) {
          assert.equal(emitData.username, "daisy");
          assert.equal(emitData.senderStatus, "help");
          assert.equal(emitData.message, "i want to sleep");

          if (++cnt === 2) {
            done();
          }
        });

        user1.emit('new public message', {
          "username": "daisy",
          "userStatus": "help",
          "message": "i want to sleep"
        });
      });
    });
  });
});


it('should send private message to user2', function(done) {
  var user1 = io.connect(socketURL, options);
  user1.on('connect', function(data) {
    var user2 = io.connect(socketURL, options);

    user2.on('connect', function(data) {
      user2.emit('user join', "user2");

      user2.on('new private message', function(emitData) {
        assert.equal(emitData.sender, "daisy");
        assert.equal(emitData.senderStatus, "help");
        assert.equal(emitData.receiver, "user2");
        assert.equal(emitData.message, "i want to sleep");
        done();
      });

      user1.emit('new private message', {
        "sender": "daisy",
        "senderStatus": "help",
        "receiver": "user2",
        "message": "i want to sleep"
      });
    });
  });
});


it('should send announcement to other users', function(done) {
  var user1 = io.connect(socketURL, options);
  user1.on('connect', function(data) {
    var user2 = io.connect(socketURL, options);
    var user3 = io.connect(socketURL, options);

    user2.on('connect', function(data) {
      user3.on('connect', function(data) {
        user2.emit('user join', "user2");
        user3.emit("user join", "user3");

        var cnt = 0;

        user2.on('new announcement', function(emitData) {
          assert.equal(emitData.sender, "daisy");
          assert.equal(emitData.message, "i want to sleep");

          if (++cnt === 2) {
            done();
          }
        });

        user3.on('new announcement', function(emitData) {
          assert.equal(emitData.sender, "daisy");
          assert.equal(emitData.message, "i want to sleep");

          if (++cnt === 2) {
            done();
          }
        });

        user1.emit('new announcement', {
          "username": "daisy",
          "message": "i want to sleep"
        });
      });
    });
  });
});
