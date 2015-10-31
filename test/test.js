var assert = require("assert");
var io = require('socket.io-client');
var app = require('../app');

/*it('should respond 401', function(done) {
	var request = require('supertest');
	var express = require('express');

    request(app)
      .post('/user/signup')
      .send({"username":"fkjf", "password":"123"})
      .expect(401, done);
});


it('should respond 201', function(done) {
	var request = require('supertest');
	var express = require('express');

    request(app)
      .post('/user/signup')
      .send({"username":"adsfadsff", "password":"1234"})
      .expect(201, done);
});


it('should respond 200', function(done) {
	var request = require('supertest');
	var express = require('express');

    request(app)
      .post('/user/signup')
      .send({"username":"daisy", "password":"1234"})
      .expect(200, done);
});


it('should respond 401', function(done) {
	var request = require('supertest');
	var express = require('express');

    request(app)
      .post('/user/signup')
      .send({"username":"daisy", "password":"ffjfj"})
      .expect(401, done);
});*/


var socketURL = 'http://localhost:3000';
var options = {
  transports: ['websocket'],
  'force new connection': true
};

it('should broadcast new status to all users', function(done) {
	var user1 = io.connect(socketURL, options);
	user1.on('connect', function(data) {
		console.log("user1 connected");
		var user2 = io.connect(socketURL, options);
      	
      	user2.on('connect', function(data) {
      		console.log("user2 connected");
      		user2.on('status update', function(emitData) {
      			console.log(user1.username);
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


it('should send private message to user2', function(done) {
	var user1 = io.connect(socketURL, options);
	user1.on('connect', function(data) {
		console.log("user1 connected");
		var user2 = io.connect(socketURL, options);
      	
      	user2.on('connect', function(data) {
      		console.log("user2 connected");
      		user2.emit('user join', "user2");
      		
      		user2.on('new private message', function(emitData) {
      			console.log("received");
      			console.log(emitData);
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
	      	console.log("after emit");
      	});
	});
});