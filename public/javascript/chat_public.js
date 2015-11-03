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
  var $duration = $('#duration');

  var chatTarget = undefined;  // Non-empty string for private mode, undefined for public mode.
  var load_time = Date.parse(new Date()) / 1000;
  var initial_loadtime = load_time;
  var interupt_flag = 0;

  var newID = 99999999;  // MaxID
  var href = window.location.href;
  var parameters = href.split('?')[1].split('=')[1];
  var username = parameters.split('&')[0].split('#')[0];
  var isNewUser = parameters.split('&')[1];
  var chatLog = undefined;

  var testMsg = 'TestTestTestTestTestTest';
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

  function updateUserList(query, status) {
    // Clear off userlist
    $userlist.empty();

    var onlineUsers = [];
    var offlineUsers = [];
    for (name in userList) {
      if (query !== undefined){
        name_t =  name.toLowerCase();
        query = query.toLowerCase();
      }      
      if (query !== undefined && name_t.indexOf(query) === -1) {
        continue;
      }

      if (status !== undefined && userList[name].userStatus !== status) {
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

  function updateDropDownUserList() {
    $('#userlist-dropdown-append').empty();

    var onlineUsers = [];
    var offlineUsers = [];
    for (name in userList) {
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
      setDropdownUserlistClick(value,true);
    });

    offlineUsers.forEach(function(value, index) {
      setDropdownUserlistClick(value,false);
    });

  }

  function setDropdownUserlistClick(user, online_flag) {
    if(online_flag) {
      var $htmlDiv = $('<li><a href="" id="chat-userlist"><span class="glyphicon glyphicon-user">' +
                     '</span>' + user + '</a></li>');
    }
    else {
      var $htmlDiv = $('<li><a href="" id="chat-userlist">' + user + '</a></li>');
    }

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
              }, false);
            } else {
              addPrivateMessage({
                username: value.sender,
                message: value.message,
                timestamp: value.timestamp,
                userStatus: value.senderStatus
              }, false);
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
          // // Userlist-toggle append
          // setDropdownUserlistClick(key);

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
      // Userlist-toggle append
      updateDropDownUserList();
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


  $("#private-refresh").click(function (event) {
    event.preventDefault();

    var queryPrivate = $("#search-private").val();
    if (queryPrivate) { // Query for more of private search results
      if ($("#search-private").data('id') === undefined) {
        return;
      }

      $.get("/searchPrivateMessages", {
        keywords: queryPrivate,
        id: $("#search-private").data('id'),
        sender: username,
        receiver: chatTarget
      }, function (response) {
        if (response.statusCode === 200) {
          response.data.forEach(function (value, index) {
            $("#search-private").data('id', value.id);
            addPrivateMessage({
              username: value.sender,
              message: value.message,
              userStatus:value.senderStatus,
              timestamp: value.timestamp
            }, false);
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


  // Get another 20 messages if in mode get message history
  // Get another 10 search results if in mode search chat messages
  $refresh.click(function (event) {
    event.preventDefault();

    var queryPublic = $("#search-public").val();
    if (queryPublic) { // Query for more of public search results
      if ($("#search-public").data('id') === undefined) {
        return;
      }

      $.get("/searchPublicMessages", {
        keywords: queryPublic,
        id: $("#search-public").data('id')
      }, function (response) {
        if (response.statusCode === 200) {
          response.data.forEach(function (value, index) {
            $("#search-public").data('id', value.id);
            addPublicMessage({
              username: value.sender,
              message: value.message,
              userStatus:value.userStatus,
              timestamp: value.timestamp
            }, false);
          });
        } else {
          BootstrapDialog.show({
            title: 'Alert Message',
            message: response.message
          });
        }
      });
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


  $("#search-status").change(function (event) {
    var status = $(this).val();
    if (status === 'Any') {
      updateUserList();
    } else if (status === 'None') {
      updateUserList('', null);
    } else {
      updateUserList('', status);
    }
  });

  function searchAnnouncement(firstSearch) {
    var isHidden = function() {
      return $(this).is(":visible") === false;
    }

    var $announcements = $announcement_body.children('.msg');

    if (firstSearch) {
      var query = $("#search-announcement").val().trim();

      if (query === "") {
        cancelSearchAnnouncement();
        return;
      }

      $("#search-announcement-cancel").attr("disabled", false);
      var queryWords = filterStopWords(query.split(/\s+/));

      var match = function($item) {
        var data = $item.data('data');
        for (i = 0; i < queryWords.length; i++) {
          if (data.message.toLowerCase().indexOf(queryWords[i].toLowerCase()) !== -1) {
            return true;
          }
        }
        return false;
      }

      $announcement_body.children('.alert').hide();

      $announcements.each(function() {
        $(this).hide();
        $(this).data('match', match($(this)));
      });
      $("#search-more-announcement").show();
    }

    $announcements.filter(function() { return $(this).data('match'); })
                  .filter(isHidden)
                  .slice(0, 10)
                  .each(function() { $(this).show(); });
  }


  $("#search-announcement-button").click(function (event) {
    event.preventDefault();
    searchAnnouncement(true);
  });

  $("#search-announcement").keydown(function (event) {
    if (event.which === 13) {
      event.preventDefault();
      searchAnnouncement(true);
    }
  });


  function cancelSearchAnnouncement() {
    $announcement_body.children().each(function() {
      $(this).show();
    });
    $("#search-announcement").val('');
    $("#search-more-announcement").hide();
    $("#search-announcement-cancel").attr("disabled", "disabled");
  }


  $("#search-announcement-cancel").click(function (event) {
    cancelSearchAnnouncement();
  });

  $("#search-more-announcement").click(function (event) {
    searchAnnouncement(false);
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

  $("#search-public-button").click(function (event) {
    searchPublic();
  });

  $("#search-public").keydown(function (event) {
    if (event.which === 13) {
      event.preventDefault();
      searchPublic();
    }
  });

  $("#search-public-cancel").click(function (event) {
    $("#public_body").html($("#public_body").data('data'));
    $("#public_body").removeData('data');
    $("#search-public").val('');
    $("#search-public-cancel").attr("disabled", "disabled");
  });

  function searchPublic() {
    var query = $("#search-public").val().trim();
    if (!query) {
      $("#public_body").html($("#public_body").data('data'));
      $("#public_body").removeData('data');
      $("#search-public-cancel").attr("disabled", "disabled");
      return;
    }

    $("#search-public-cancel").attr("disabled", false);
    $.get("/searchPublicMessages", {
      keywords: query,
      id: 99999999
    }, function (response) {
      if (response.statusCode === 200) {
        var $publicBody = $("#public_body");
        if (!$publicBody.data('data')) {
          $publicBody.data('data', $publicBody.html());
        }
        $publicBody.empty();
        response.data.forEach(function (value, index) {
          $("#search-public").data('id', value.id);
          addPublicMessage({
            username: value.sender,
            message: value.message,
            userStatus:value.userStatus,
            timestamp: value.timestamp
          }, false);
        });
      } else {
        BootstrapDialog.show({
          title: 'Alert Message',
          message: response.message
        });
      }
    });
  }

  $("#search-private-button").click(function (event) {
    searchPrivate();
  });

  $("#search-private").keydown(function (event) {
    if (event.which === 13) {
      event.preventDefault();
      searchPrivate();
    }
  });

  $("#search-private-cancel").click(function (event) {
    $("#private_body").html($("#private_body").data('data'));
    $("#private_body").removeData('data');
    $("#search-private").val('');
    $("#search-private-cancel").attr("disabled", "disabled");
  });


  function searchPrivate() {
    var query = $("#search-private").val().trim();
    if (!query) {
      $("#private_body").html($("#private_body").data('data'));
      $("#private_body").removeData('data');
      $("#search-private-cancel").attr("disabled", "disabled");
      return;
    }

    $("#search-private-cancel").attr("disabled", false);
    $.get("/searchPrivateMessages", {
      keywords: query,
      sender: username,
      receiver: chatTarget,
      id: 99999999
    }, function (response) {
      if (response.statusCode === 200) {
        var $privateBody = $("#private_body");
        if (!$privateBody.data('data')) {
          $privateBody.data('data', $privateBody.html());
        }
        $privateBody.empty();
        response.data.forEach(function (value, index) {
          $("#search-private").data('id', value.id);
          addPrivateMessage({
            username: value.sender,
            message: value.message,
            userStatus:value.senderStatus,
            timestamp: value.timestamp
          }, false);
        });
      } else {
        BootstrapDialog.show({
          title: 'Alert Message',
          message: response.message
        });
      }
    });
  }

  function parseStopWords() {
    $.get('../stopWords.txt', function (data) {
      var stopWordsList = data.split(',');
      for (var i = 0; i < stopWordsList.length; i++) {
        stopWordsDict[stopWordsList[i]] = true;
      }
    });
  }


 $("#start_test_post").click(function(event) {
    /* Act on the event */
    event.preventDefault();
    // socket.emit('block other operations');
    $('#myModal2').modal('show');
    socket.emit("start measuring performance",{username: username});

    console.log('start_test');
    var dur=$('#duration').val();

    var postCount = 0;
    var start = new Date();

    var reqCount = 0;
    setTimeout(function() {
       while ((elapse = new Date() - start) < dur * 1000 )
      {
       reqCount++;

      $.post("/postPublicMessageTest", {
        sender: username,
        message: testMsg,
        timestamp: load_time,
        senderLocation: 'B19',
        senderStatus: userList[username].userStatus
      },
      function(response){
        //if(response.statusCode == 200){
        postCount++;
        //console.log("response: "+response+" count: "+postCount);
      });

      }
    },500);

    setTimeout(function() {
      console.log("postCount: " + postCount);
      // console.log("getCount: " + getCount);
      console.log("reqCount: " + reqCount);
      
      var htmlDiv1 = '<div><strong> The Number of POST Requests per second is: ' + Math.round(postCount/dur) + ' /sec</strong></div><br>';
      $('#test_result').append(htmlDiv1);
      // var htmlDiv2 = '<div><strong> The Number of GET Requests per second) is: ' + Math.round(getCount/dur) + ' /sec</strong></div><br>';
      // $('#test_result').append(htmlDiv2);
      socket.emit('stop measuring performance',{username: username});

    }, 100+dur*1000);
  });

$("#start_test_get").click(function(event) {
    /* Act on the event */
    event.preventDefault();
    // socket.emit('block other operations');
    $('#myModal2').modal('show');
    socket.emit("start measuring performance",{username: username});

    console.log('start_test');
    var dur=$('#duration').val();

    var getCount = 0;
    var start = new Date();

    var reqCount = 0;
    setTimeout(function() {
    while ((elapse = new Date() - start) < dur * 1000 )
      {
       reqCount++;

      $.get("/getPublicMessageTest",
        function (response) {
          getCount++;
          //console.log("response: "+response+" count: "+postCount);
      });

      }
    },500);

    setTimeout(function() {
      console.log("getCount: " + getCount);
      console.log("reqCount: " + reqCount);
      
      // var htmlDiv1 = '<div><strong> The Number of POST Requests per second is: ' + Math.round(postCount/dur) + ' /sec</strong></div><br>';
      // $('#test_result').append(htmlDiv1);
      var htmlDiv2 = '<div><strong> The Number of GET Requests per second) is: ' + Math.round(getCount/dur) + ' /sec</strong></div><br>';
      $('#test_result').append(htmlDiv2);
      socket.emit('stop measuring performance',{username: username});
      }, 100+dur*1000);

  });

  $("#clean_test").click(function(event) {
      $('#test_result').empty();
      $('#duration').val('');
  });

  $("#stop_test").click(function(event) {

      console.log("I click the stop");
      socket.emit("interupt measuring performance",{username:username});  
      setTimeout(function(){
      $('#test_result').empty();
      $('#duration').val('');
    },1000);
    });

  //other users cannot operate
   socket.on('start measuring performance', function (data) {
   $('#myModal').modal('show');
  });

  //measure performance end normally
  socket.on('stop measuring performance', function (data) { 
   $('#myModal').modal('hide');
   $('#myModal2').modal('hide');
  });

  //interupt measure performance 
  socket.on('interupt measuring performance', function (data) {
   // $('#myModal2').modal('show');
   console.log("I receive the interupt socket");
   $('#test_result').empty();
   $('#duration').val('');
   $('#myModal2').modal('hide');
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

    updateUserList();
    updateDropDownUserList();
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (username) {
    userList[username].online = false;
    updateUserList();
    updateDropDownUserList();
  })

  // socket.on('unblock other operations', function () {
  //  $('#myModal2').modal('hide');
  // });

  // TODO: remove user from dropdownuserlistclick when user left room x
  // TODO: Restructure UI for private chat (now: click on userlist, nothing happens, expected: auto move to chat private,
  // propose: remove private chat tab, interact through user list only)
  // TODO: search private: remove receiver field in database
  // TODO: now word search for status also
  // TODO: search public bug, return results not correct
  // TODO: add 'refresh' button for private chat + search private chat

  // add search by status, search by username
  // mocha + test coverage
});
