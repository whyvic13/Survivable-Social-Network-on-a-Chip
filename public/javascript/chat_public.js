$(document).ready(function() {
  var socket = io.connect();
  var $public_post = $("#btn-chat");
  var $public_message = $("#btn-input");
  var $private_post = $("#private-chat");
  var $private_message = $("#private-input");
  var $userlist = $("#userlist");
  var $public_body = $("#public_body");
  var $private_body = $("#private_body");
  var $logout = $("#logout");
  var $refresh = $("#refresh");
  var $save_action = $("#save_action");
  var $announcement_message = $("#announcement_message");
  var $announcement_body = $("#announcement_body");

  var chatTarget = undefined;  // Non-empty string for private mode, undefined for public mode.
  var load_time = Date.parse(new Date()) / 1000;
  var initial_loadtime = load_time;

  var newID = 99999999;  // MaxID
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
  var stopWordsDict = {};
  parseStopWords();

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
    } else if (safety === 'Help') {
      // Yellow 'Help'
      $htmlDiv = statusDiv('label-warning', 'HELP');
    } else if (safety === 'Emergency') {
      // Red 'Emergency'
      $htmlDiv = statusDiv('label-danger', 'EMERGENCY');
    } else {
      $htmlDiv = statusDiv('label-default', 'NONE');
    }
    $userlist.append($htmlDiv);
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
      statusText = "OK";
    } else if (status === "Help") {
      labelName = "label-warning";
      statusText = "HELP";
    } else if (status === "Emergency") {
      labelName = "label-danger";
      statusText = "EMERGENCY";
    } else {
      labelName = "label-default";
      statusText = "NONE";
    }

    return '<li class="left clearfix"><span class="chat-img pull-left">' +
      '<img src="./img/' + png + '.png" alt="User Avatar" class="img-circle" />' +
      '</span><div class="chat-body clearfix">' +
      '<div class="header"><strong class="primary-font">' + sender +
      '</strong> &nbsp;&nbsp;&nbsp;&nbsp;<span class="label '
      + labelName + '">' + statusText + '</span><small class="pull-right text-muted"><span class="glyphicon glyphicon-time">' +
      '</span>' + formattedTime + '</small></div>' +
      '<p>' + message + '</p></div></li>';
  }


  function addMessage(data, flag, $messageBody) {
    var htmlDiv = getMessageDiv(data.username, data.userStatus, data.timestamp, data.message);
    $messageBody.append(htmlDiv);
    if (flag) {
      $messageBody.parent().animate({
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

  function addAnnouncementMessage(data) {
    var date = new Date(data.timestamp * 1000);
    var time = (date.getMonth() + 1) + '.' + date.getDate() + '  ' + date.toLocaleTimeString();
    var $div = $('<div class="media msg "><a class="pull-left" ></a>' +
      '<h5 div class="media-body">' + time + '</h5>' +
      '<h5 class="media-heading">' + data.sender + '</h5>' +
      '<h4 class="col-lg-10">' + data.message + '</h4>' +
      '</div></div><div class="alert alert-info msg-date"></div>');
    $div.data('data', data);
    $announcement_body.prepend($div);
  }


  function setDropdownUserlistClick(user) {
    var $htmlDiv = $('<li><a href="" id="chat-userlist"><span class="glyphicon glyphicon-user">' +
                     '</span>' + user + '</a></li>');
    $('#userlist-dropdown-append').append($htmlDiv);
    $htmlDiv.children('#chat-userlist').click(function (event) {
      event.preventDefault();
      chatTarget = $(this).text();

      // Set chat name
      $('#private-head').empty().append('   ' + chatTarget);

      // Get private history message
      $private_body.empty();
      $.get("/getPrivateMessages",{
        sender: username,
        receiver: chatTarget
      }, function (response) {
        if (response.statusCode == 200) {
          response.data.forEach(function (value, index) {
            if (value.sender == username) {
              addPrivateMessage({
                username: value.sender,
                message: value.message,
                timestamp: value.timestamp,
                userStatus: value.senderStatus
              }, true);
            } else {
              addPrivateMessage({
                username: value.sender,
                message: value.message,
                timestamp: value.timestamp,
                userStatus: value.senderStatus
              }, true);
            }
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


  // Get all users from REST GET
  $.get("/users", function (response) {
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

  // Get announcement messages
  $.get("/getAnnoucements", function (response) {
    if (response.statusCode === 200) {
      response.data.forEach(function (value, index) {
        addAnnouncementMessage({
          sender: value.sender,
          message: value.message,
          timestamp: value.timestamp
        });
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
  $public_post.click(function (event) {
    event.preventDefault();
    postPublicMessage();
  });


  // Public chat post button
  $private_post.click(function (event) {
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

            $public_body.parent().animate({
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
      var htmlDiv = '<li><a href="" id="' + key + '"><span class="glyphicon glyphicon-refresh">' +
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
    } else if (newStatus === "Help") {
      labelName = "label-warning";
      statusText = "HELP";
    } else if (newStatus === "Emergency") {
      labelName = "label-danger";
      statusText = "EMERGENCY";
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
    if (event.which === 13) {
      event.preventDefault();
    }
  });

  // Allows instant search
  $("#search-username").keyup(function (event) {
    var query = $(this).val();
    updateUserList(query);
  });

  // Cancel search username
  $("#search-username-cancel").click(function (event) {
    updateUserList("");
    $("#search-username").val("");
  });


  function searchAnnoucement() {
    var query = $("#search-announcement").val().trim();
    var queryWords = filterStopWords(query.split(/\s+/));
    $announcement_body.children().each(function() {
      var data = $(this).data('data');
      var i;
      for (i = 0; i < queryWords.length; i++) {
        if (data.message.toLowerCase().indexOf(queryWords[i].toLowerCase()) !== -1) {
          break;
        }
      }

      if (i == queryWords.length) {
        $(this).hide();
      } else {
        $(this).show();
      }
    });
  }


  $("#search-announcement-button").click(function (event) {
    searchAnnoucement();
  });

  $("#search-announcement").keydown(function (event) {
    if (event.which === 13) {
      event.preventDefault();
      searchAnnoucement();
    }
  });


  $("#search-announcement-cancel").click(function (event) {
    $announcement_body.children().each(function() {
      $(this).show();
      $("#search-announcement").val('');
    });
  });

  function filterStopWords(words) {
    var ret = [];
    for (var i = 0; i < words.length; i++) {
      if (!(words[i] in stopWordsDict)) {
        ret.push(words[i]);
      }
    }
    return ret;
  }

  /*$("#search-chat").keydown(function (event) {
    // When 'Return' key is pressed, post the message
    if (event.which === 13) {
      event.preventDefault();
    }

    if (!($("#search-chat").val())) {
      chatLog = $public_body.html();
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
  });*/

  function parseStopWords() {
    $.get('../stopWords.txt', function (data) {
      var stopWordsList = data.split(',');
      for (var i = 0; i < stopWordsList.length; i++) {
        stopWordsDict[stopWordsList[i]] = true;
      }
    });
  }


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
    addAnnouncementMessage(data);
  });


  socket.on('status update', function (data) {
    userList[data.username].userStatus = data.userStatus;
    updateUserList();
  });


  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user join', function (username) {
    if (username in userList) {
      userList[username].online = true;
    } else {  // New sign-up user
      userList[username] = {
        online: true,
        userStatus: null
      };
    }

    setDropdownUserlistClick(username);
    updateUserList();
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (username) {
    userList[username].online = false;
    updateUserList();
  });

  // TODO: remove user from dropdownuserlistclick when user left room
  // TODO: Add effect to let user know which tab he/she currently in
  // TODO: Restructure UI for private chat (now: click on userlist, nothing happens, expected: auto move to chat private,
  // propose: remove private chat tab, interact through user list only)
});
