$(document).ready(function() {
  var socket = io.connect();
    var $public_post = $("#btn-chat")
        $public_message = $("#btn-input")
        $private_post = $("#private-chat")
        $private_message = $("#private-input")
        $userlist = $("#userlist")
  $public_body = $("#public_body")
        $private_body = $("#private_body")
  $logout = $("#logout")
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

  $("#head_title").append("<h3>WELCOME " + username + " !</h3>");
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
    var online_status = status ? " online" : " offline";
    var safety = safety_status;

    var statusDiv = function(buttonClass, status) {

      return $('<tr><td><div class="round round-lg'+online_status+'"><span class="glyphicon glyphicon-user"></span></div>'+
               '<a class="user-link">'+user+'</a></td><td class="text-center">'+
               '<span class="label ' + buttonClass + '">' + status +
               '</span></td>');
    }

    var $htmlDiv = '';
    if (safety === 'OK') {
      // Green 'Ok'
      $htmlDiv = statusDiv('label-success', 'OK');
    } else if (safety === 'Emergency') {
      // Yellow 'Emergency'
      $htmlDiv = statusDiv('label-warning', 'EMERGENCY');
    } else if (safety === 'Help') {
      // Red 'Help'
      $htmlDiv = statusDiv('label-danger', 'HELP');
    } else {
      $htmlDiv = statusDiv('label-default', 'NONE');
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
            addPrivateMessage({
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
    $userlist.empty();

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


  function getMessageDiv(sender, status, timestamp, message) {
    var date = new Date(timestamp * 1000);
    var formattedTime = (date.getMonth() + 1) + '.' + date.getDate() + '  ' + date.toLocaleTimeString();
    var firstCharacter = sender[0].toLowerCase();
    var png = (username === sender ? "me" : firstCharacter);
    var labelName, statusText;
    if (status === "OK") {
      labelName = "label-success";
      statusText = "OK;
    } else if (status === "Emergency") {
      labelName = "label-warning";
      statusText = "EMERGENCY";
    } else if (status === "Help") {
      labelName = "label-danger";
      statusText = "DANGER";
    } else {
      labelName = "label-default";
      statusText = "NONE";
    }
    return '<li class="left clearfix"><span class="chat-img pull-left">'+
      '<img src="./img/'+png+'.png" alt="User Avatar" class="img-circle" />'+
      '</span><div class="chat-body clearfix">' +
      '<div class="header"><strong class="primary-font">'+sender+
      '</strong> &nbsp;&nbsp;&nbsp;&nbsp;<span class="label '
      + labelName + '">' + statusText + '</span><small class="pull-right text-muted"><span class="glyphicon glyphicon-time">'+
      '</span>'+formattedTime+'</small></div>'+
      '<p>'+message+'</p></div></li>';
  }


  function addMessage(data, flag, $messageBody) {
    var htmlDiv = getMessageDiv(data.username, data.userStatus, data.timestamp, data.message);
    $public_body.append(htmlDiv);
    if (flag) {
      $messageBody.animate({
        scrollTop: $messageBody[0].scrollHeight
      }, 500);
    }
  }

  function addPublicMessage(data, flag) {
    addMessage(data, flag, $public_body);
  }

  function addPrivateMessage(data, flag) {
    addMessage(data, flag, $private_body);
  }

  function addAnnouncementMessage(data, flag) {
    var date = new Date(data.timestamp * 1000);
    var time = (date.getMonth() + 1) + '.' + date.getDate() + '  ' + date.toLocaleTimeString();
    var htmlDiv = '<div class="media msg "><a class="pull-left" ></a>' +
      '<h5 div class="media-body">' + time + '</h5>' +
      '<h5 class="media-heading">' + data.sender + '</h5>' +
      '<h4 class="col-lg-10">' +data.message + '</h4>' +
      '</div></div><div class="alert alert-info msg-date"></div>';
    $announcement_body.append(htmlDiv);
  }

  function setDropdownUserlistClick(user) {
      var $htmlDiv = $('<li><a href="" id="chat-userlist"><span class="glyphicon glyphicon-user">'+
                     '</span>'+user+'</a></li>');
      $('#userlist-dropdown-append').append($htmlDiv);
      $htmlDiv.children('#chat-userlist').click(function(event) {
        event.preventDefault();
        receiver = $(this).text();
        // set chat name
        $('#private-head').empty().append('   '+receiver);

        // get private history message
        $private_body.empty();
        $.get("/getPrivateMessages",{
          sender: username,
          receiver: receiver
        },
        function(response){
          // console.log(response);
          if(response.statusCode == 200){
            response.data.forEach(function (value, index){
              if(value.sender == username) {
                addPrivateMessage({
                  username: value.sender, 
                  message: value.message, 
                  timestamp: value.timestamp,
                  userStatus: value.senderStatus
                }, true);
              }
              else {
                addPrivateMessage({
                  username: value.sender, 
                  message: value.message, 
                  timestamp: value.timestamp,
                  userStatus: value.senderStatus
                }, true);
              }
              
            });
          }
          else{
            BootstrapDialog.show({
              title: 'Alert Message',
              message: "Bad database request."
            });
          }
        });
      });
    }


  // Get all users from REST GET
  $.get("/users", function(response) {
    if (response.statusCode === 200) {
      userList = response;
      delete userList.statusCode;
      for (key in userList) {
        if (userList[key].online === 1) {
          // Userlist-toggle append
          setDropdownUserlistClick(key);

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
          addPublicMessage({
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


  function postPublicMessage() {
    var message = $public_message.val().trim();

    if (!message) {
      BootstrapDialog.show({
        title: 'Alert Message',
        message: 'Cannot input empty message!'
      });
    } else {
      socket.emit('new public message', {
        username: username,
        message: message,
        userStatus: userList[username].userStatus
      });
    }

    $public_message.val('');
  }

  function postPrivateMessage() {
    var message = $private_message.val().trim();

    if (!message) {
      BootstrapDialog.show({
        title: 'Alert Message',
        message: 'Cannot input empty message!'
      });
    } else {
      socket.emit('new private message', {
        sender: username,
        receiver: chatTarget,
        senderStatus: userList[username].userStatus,
        message: message
      });
    }

    $private_message.val('');
  }

  // Public chat post button
  $public_post.click(function(event) {
    event.preventDefault();
    postPublicMessage();   
  });

  // Public chat post button
  $private_post.click(function(event) {
    event.preventDefault();
    postPrivateMessage();   
  });


  $public_message.keydown(function (event) {
    // When 'Return' key is pressed, post the message
    if (event.which === 13) {
      event.preventDefault();
      postPublicMessage();
    }
  });


  $private_message.keydown(function (event) {
    // When 'Return' key is pressed, post the message
    if (event.which === 13) {
      event.preventDefault();
      postPrivateMessage();
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

  $("#userlist-dropdwon").click(function (event) {
    for (key in userList) {
      var htmlDiv = '<li><a href="" id="'+key+'"><span class="glyphicon glyphicon-refresh">'+
                    '</span>Refresh</a></li>';
      $('#userlist-dropdown-append').append(htmlDiv);
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
    var labelName, statusText;
    if (newStatus === "OK") {
      labelName = "label-success";
      statusText = "OK";
    } else if (newStatus === "Emergency") {
      labelName = "label-warning";
      statusText = "EMERGENCY";
    } else if (newStatus === "Help") {
      labelName = "label-danger";
      statusText = "HELP";
    }

    $('#status-toggle').empty().append(
      'Status: <span class="label ' + labelName + '">' + statusText + '</span><span class="caret"></span>');
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
      addPrivateMessage({
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
    addPublicMessage({
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
      setDropdownUserlistClick(username);
    }

    updateUserList();
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (username) {
    userList[username].online = false;
    updateUserList();
  });
});
