$(document).ready(function() {
  var socket = io.connect();
  var $public_post = $("#public_post")
  $public_message = $("#public_message")
  $userlist = $(".sidebar-nav")
  $public_body = $("#public_body")
  $logout = $("#logout")
  $userlist_head = $(".userlist_head")
  $refresh = $("#refresh")
  $save_action = $("#save_action")
  $announcement_message = $("#announcement_message")
  $announcement_body = $("#announcement_body");
  var chatTarget = undefined;  // Non-empty string for private mode, undefined for public mode.
  var load_time = Date.parse(new Date()) / 1000;
  var initial_loadtime = load_time;
  var newID = 99999999;
  var href = window.location.href;
  var parameters = href.split('?')[1].split('=')[1];
  var username = parameters.split('&')[0];
  var isNewUser = parameters.split('&')[1];
  var chatLog = undefined;

  $userlist_head.append("<h3>Welcome " + username + " !</h3>");
  if (isNewUser == "1") {
    $('#welcome_message').show();
  }
  var userList = {};  // Save up all the registered user

  // Emits user join event
  socket.emit("user join", username);

  // Prevents input from having injected markup
  function cleanInput(input) {
    return $('<div/>').text(input).text();
  }

  function addUserList(user, status, safety_status) {
    var online_status = status ? " online" : "";
    var safety = safety_status;

    var statusDiv = function(buttonClass) {
      return $('<div class="media conversation"><a class="btn pull-left" role="button">' +
        '<img class="media-object" data-src="holder.js/64x64" alt="64x64" style="width: 30px; height: 30px;" src="img/user-icon.png"></a>' +
        '<div class="media-body"><h5 class="media-heading">' + user + '</h5>' +
        '<span class="glyphicon glyphicon-user' + online_status + '"></span>' +
        (buttonClass === undefined ? '<a class="btn ' + buttonClass + ' pull-right" ><i class="fa fa-check-square"></i></a>' : '') +
        '</div></div>');
    }

    var $htmlDiv = '';
    if (safety === 'OK') {
      // Green 'Ok'
      $htmlDiv = statusDiv('btn-success');
    } else if (safety === 'Emergency') {
      // Yellow 'Emergency'
      $htmlDiv = statusDiv('btn-warning');
    } else if (safety === 'Help') {
      // Red 'Help'
      $htmlDiv = statusDiv('btn-danger');
    } else {
      $htmlDiv = statusDiv();
    }
    $userlist.append($htmlDiv);

    // Click function
    $htmlDiv.children(".btn.pull-left").click(function(event) {
      event.preventDefault();
      chatTarget = $(this).siblings(".media-body").text();
      $public_body.empty();
      $('#refresh-wrap').empty();
      $("#refresh-wrap").append('<a id="refresh" class="col-xs-3 pull-left"><h4>' + chatTarget + '</h4></a>');
      $refresh.css("visibility", "hidden");


      $.get("/getPrivateMessages", {
        sender: username,
        receiver: chatTarget
      }, function(response) {
        $userlist.append($htmlDiv);
        if (response.statusCode == 200) {
          response.data.forEach(function(value, index) {
            addMessage({
              username: value.sender,
              message: value.message,
              timestamp: value.timestamp,
              userStatus: value.senderStatus
            }, false);
          });
        } else {
          BootstrapDialog.show({
            title: 'Alert Message',
            message: "Bad database request."
          });
        }
      });
    });
  }

  function updateUserList(query) {
    // Clear off userlist
    $userlist.children(".media.conversation").remove();

    var onlineUsers = [];
    var offlineUsers = [];
    for (name in userList) {
      if (query !== undefined && name.indexOf(query) === -1) {
        continue;
      }

      if (userList[name].online) {
        onlineUsers.push(name);
      } else {
        offlineUsers.push(name);
      }
    }

    var lowerCaseComparer = function(a, b) {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    };

    onlineUsers.sort(lowerCaseComparer);
    offlineUsers.sort(lowerCaseComparer);

    onlineUsers.forEach(function(value, index) {
      addUserList(value, true, userList[value].userStatus);
    });

    offlineUsers.forEach(function(value, index) {
      addUserList(value, false, userList[value].userStatus);
    });
  }


  function getMessageDiv(username, status, timestamp, message) {
    var date = new Date(timestamp * 1000);
    var formattedTime = (date.getMonth() + 1) + '.' + date.getDate() + '  ' + date.toLocaleTimeString();
    return '<div class="media msg "><a class="pull-left">' +
      '<img class="media-object" data-src="holder.js/64x64" alt="64x64" style="width: 32px; height: 32px;" src="img/user-icon.png"></a>' +
      '<div class="media-body"><small class="pull-right time">' + status + ' <i class="fa fa-clock-o"></i> ' + formattedTime + '</small>' +
      '<h5 class="media-heading">' + username + '</h5><small class="col-lg-10">' + message + '</small>' +
      '</div></div><div class="alert alert-info msg-date"></div>';
  }


  function addMessage(data, flag) {
    var htmlDiv = getMessageDiv(data.username, data.userStatus, data.timestamp, data.message);
    $public_body.append(htmlDiv);
    if (flag) {
      $public_body.animate({
        scrollTop: $public_body[0].scrollHeight
      }, 500);
    }
  }

  function addAnnouncementMessage(data, flag) {
    var date = new Date(data.timestamp * 1000);
    var time = (date.getMonth() + 1) + '.' + date.getDate() + '  ' + date.toLocaleTimeString();
    var htmlDiv = '<div class="media msg "><a class="pull-left" ></a>' +
      '<div class="media-body"><small>' + time + '</small>' +
      '<h5 class="media-heading">' + data.sender + '</h5>' +
      '<small class="col-lg-10">' + data.message + '</small>' +
      '</div></div><div class="alert alert-info msg-date"></div>';
    $announcement_body.append(htmlDiv);
  }


  // Get all users from REST GET
  $.get("/users", function(response) {
    if (response.statusCode === 200) {
      userList = response;
      delete userList.statusCode;
      for (key in userList) {
        if (userList[key].online === 1) {
          userList[key].online = true;

          // Add online user first
          addUserList(key, true, userList[key].userStatus);
        } else {
          userList[key].online = false;
        }
      }

      // Then add offline user
      for (key in userList) {
        if (userList[key].online === false) {
          addUserList(key, false, userList[key].userStatus);
        }
      }
    } else {
      BootstrapDialog.show({
        title: 'Alert Message',
        message: "Bad database request."
      });
    }

  });


  // Get all public messages
  function getPublicMessages() {
    $.get("/getPublicMessages", {
      start: load_time,
      ID: newID
    }, function (response) {
      if (response.statusCode === 200) {
        load_time = response.newtime;
        newID = response.newID;

        response.data.forEach(function (value, index) {
          addMessage({
            username: value.sender,
            message: value.message,
            timestamp: value.timestamp,
            userStatus: value.senderStatus
          }, false);
        });
      } else if (response.statusCode === 401) {
        BootstrapDialog.show({
          title: 'Alert Message',
          message: response.message
        });
      } else {
        BootstrapDialog.show({
          title: 'Alert Message',
          message: response.message
        });
      }
    });
  }

  getPublicMessages();

  // Get Announcement messages
  $.get("/getAnnoucements", function (response) {
    if (response.statusCode === 200) {
      response.data.forEach(function (value, index) {
        addAnnouncementMessage({
          sender: value.sender,
          message: value.message,
          timestamp: value.timestamp
        }, false);
      });
    } else if (response.statusCode === 401) {
      BootstrapDialog.show({
        title: 'Alert Message',
        message: response.message
      });
    } else {
      BootstrapDialog.show({
        title: 'Alert Message',
        message: response.message
      });
    }
  });


  $(".public_button").click(function (event) {
    event.preventDefault();
    chatTarget = undefined;  // Return to public chat mode

    $('#refresh-wrap').empty();
    $('#refresh-wrap').append('<a id="refresh" class="btn col-xs-1 pull-right" role="button" style="color: #fff;"><span class="glyphicon glyphicon-refresh" aria-hidden="true"></span></a>');
    $public_body.empty();

    // Re-initial
    load_time = initial_loadtime;
    newID = 9999999;

    getPublicMessages();
  });

  function postMessage() {
    var message = $public_message.val().trim();

    if (!message) {
      BootstrapDialog.show({
        title: 'Alert Message',
        message: 'Cannot input empty message!'
      });
    } else if (chatTarget === undefined) {
      socket.emit('new public message', {
        username: username,
        message: message,
        userStatus: userList[username].userStatus
      });
    } else {
      socket.emit('new private message', {
        sender: username,
        receiver: chatTarget,
        senderStatus: userList[username].userStatus,
        message: message
      });
    }

    $public_message.val('');
  }

  // Send message button
  // TODO: rename public_post into post_message button
  $public_post.click(function (event) {
    event.preventDefault();
    postMessage();
  });


  // TODO: rename public_message into message_box
  $public_message.keydown(function (event) {
    // When 'Return' key is pressed, post the message
    if (event.which === 13) {
      event.preventDefault();
      postMessage();
    }
  });


  $("#save_action").click(function (event) {
    event.preventDefault();
    var announcement = $announcement_message.val().trim();
    if (announcement) {
      socket.emit('new announcement', {
        username: username,
        message: announcement
      });
    } else {
      BootstrapDialog.show({
        title: 'Alert Message',
        message: 'Cannot input empty message!'
      });
    }
    $announcement_message.val('');
  });

  // Get another 20 messages if in mode get message history
  // Get another 10 search results if in mode search chat messages
  $refresh.click(function (event) {
    event.preventDefault();

    var query = $("#search-chat").val();
    if (query) { // Search mode
      /*$get("/searchPrivateMessages", {
        username: username,
        query: query,
        ID: newID
      }, function (response) {
        for (var i = 0; i < response.data.length; i++) {
          var data = response.data[i];
          var htmlDiv = getMessageDiv(data.sender, data.senderStatus, data.timestamp, data.message);
          $public_body.prepend(htmlDiv);
        }
        newID = response.newID;
      });*/
    } else { // Chat mode
      $.get("/getPublicMessages", {
          start: load_time,
          ID: newID
        }, function (response) {
          if (response.statusCode === 200) {
            load_time = response.newtime;
            newID = response.newID;

            for (var i = response.data.length - 1; i >= 0; i--) {
              var data = response.data[i];
              var htmlDiv = getMessageDiv(data.sender, data.senderStatus, data.timestamp, data.message);
              $public_body.prepend(htmlDiv);
            }

            $public_body.animate({
              scrollTop: 0
            }, 500);
          } else if (response.statusCode === 401) {
            BootstrapDialog.show({
              title: 'Alert Message',
              message: response.message
            });
          } else {
            BootstrapDialog.show({
              title: 'Alert Message',
              message: response.message
            });
          }
        });
    }
  });

  // Logout
  $logout.click(function (event) {
    event.preventDefault();
    $.get("/user/logout", {
        username: username
      }, function (response) {
        socket.emit("user left", username);
        window.location.href = "/";
      }
    );
  });


  // Click to toggle side_menu
  $("#menu-toggle").click(function (event) {
    event.preventDefault();
    $("#wrapper").toggleClass("toggled");
  });


  function updateStatus(newStatus) {
    userList[username].userStatus = newStatus;
    updateUserList();
    socket.emit('share status', {
      username: username,
      userStatus: newStatus
    });
  }

  $("#status-ok").click(function (event) {
    event.preventDefault();
    updateStatus('OK');
  });

  $("#status-emergency").click(function (event) {
    event.preventDefault();
    updateStatus('Emergency');
  });

  $("#status-help").click(function (event) {
    event.preventDefault();
    updateStatus('Help');
  });


  $("#search-username").keydown(function (event) {
    // When 'Return' key is pressed, post the message
    if (event.which === 13) {
      event.preventDefault();
    }
  });

  // Allows instant search
  $("#search-username").keyup(function (event) {
    var query = $(this).val();
    updateUserList(query);
  });


  $("#search-chat").keydown(function (event) {
    // When 'Return' key is pressed, post the message
    if (event.which === 13) {
      event.preventDefault();
    }

    if (!($("#search-chat").val())) {
      chatLog = #public_body.html();
    }
  });

  // Allows instant search
  $("#search-chat").keyup(function (event) {
    var query = $(this).val();

    if (!query) {
      $public_body.html(chatLog);
    } else {
      $public_body.html("");  // Clean up space for diplaying results

      $.get("/searchPrivateMessages", {
        username: username,
        query: query
      }, function (response) {
        for (var data in response) {
          var htmlDiv = getMessageDiv(data.sender, data.senderStatus, data.timestamp, data.message);
          $public_body.prepend(htmlDiv);
        }
      });
    }
  });


  // Whenever the server emits new message, update the chat body
  socket.on('new private message', function (data) {
    if (data.sender === username || data.sender === chatTarget) {
      addMessage({
        username: data.sender,
        timestamp: data.timestamp,
        message: data.message,
        userStatus: data.senderStatus
      }, true);
    } else {
      BootstrapDialog.show({
        title: 'Alert Message',
        message: "message from : " + data.sender,
      });
    }
  });


  socket.on('new public message', function (data) {
    addMessage({
      username: data.username,
      timestamp: data.timestamp,
      message: data.message,
      userStatus: data.senderStatus
    }, true);
  });


  socket.on('new announcement', function (data) {
    addAnnouncementMessage(data, true);
  });


  socket.on('status update', function (data) {
    userList[data.username].userStatus = data.userStatus;
    updateUserList();
  });


  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user join', function (username) {
    if (username in userList) {
      userList[username].online = true;
    } else {
      userList[username] = {
        online: true,
        userStatus: null
      };
    }

    updateUserList();
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (username) {
    userList[username].online = false;
    updateUserList();
  });
});
