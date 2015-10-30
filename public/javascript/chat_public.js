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

// <<<<<<< HEAD
//     function addUserList(user,status,safety_status) {
//       //
//       var online_status = status? " online" : "";
//       var safety = safety_status;
//       if(safety == 'OK') { 
//         // green 'Ok'
//         var $htmlDiv = $('<div class="media conversation">'+
//         '<a class="btn pull-left" role="button"><img class="media-object" data-src="holder.js/64x64" alt="64x64" style="width: 30px; height: 30px;" src="img/user-icon.png"></a>'+
//         '<div class="media-body"><h5 class="media-heading">'+user+
//         '</h5><span class="glyphicon glyphicon-user'+online_status+'"></span><a class="btn btn-success pull-right" ><i class="fa fa-check-square"></i></a></div></div>');}
//       else if(safety == 'Emergency'){
//         //yellow 'Emergency'
//         var $htmlDiv = $('<div class="media conversation">'+
//         '<a class="btn pull-left" role="button"><img class="media-object" data-src="holder.js/64x64" alt="64x64" style="width: 30px; height: 30px;" src="img/user-icon.png"></a>'+
//         '<div class="media-body"><h5 class="media-heading">'+user+
//         '</h5><span class="glyphicon glyphicon-user'+online_status+'"></span><a class="btn btn-warning pull-right" ><i class="fa fa-check-square"></i></a></div></div>');}
//       else if(safety == 'Help'){
//         //red 'Help'
//         var $htmlDiv = $('<div class="media conversation">'+
//         '<a class="btn pull-left" role="button"><img class="media-object" data-src="holder.js/64x64" alt="64x64" style="width: 30px; height: 30px;" src="img/user-icon.png"></a>'+
//         '<div class="media-body"><h5 class="media-heading">'+user+
//         '</h5><span class="glyphicon glyphicon-user'+online_status+'"></span><a class="btn btn-danger pull-right" ><i class="fa fa-check-square"></i></a></div></div>');}
//       else{
//         var $htmlDiv = $('<div class="media conversation">'+
//         '<a class="btn pull-left" role="button"><img class="media-object" data-src="holder.js/64x64" alt="64x64" style="width: 30px; height: 30px;" src="img/user-icon.png"></a>'+
//         '<div class="media-body"><h5 class="media-heading">'+user+
//         '</h5><span class="glyphicon glyphicon-user'+online_status+'"></span></div></div>');}
//       $userlist.append($htmlDiv);

//       //click function
//       $htmlDiv.children(".btn.pull-left").click(function(event){
//         event.preventDefault();
//         receiver = $(this).siblings(".media-body").text();
//         chat_flag = false;// post method turn to private chat
  
//         $public_body.empty();
//         $('#refresh-wrap').empty();
//         $("#refresh-wrap").append('<label class="pull-right"><h4>'+receiver+'</h4></label>');
//         // $("#refresh-wrap").append('<a id="public_button" class="navbar-custom btn  pull-left" role="button" ><i class="fa fa-play-circle"></i> Back</a>');
//         // $refresh.css("visibility","hidden");

        
//         $.get("/getPrivateMessages",{
//           sender: username,
//           receiver: receiver
//         },
//         function(response){
//           // console.log(response);
//           if(response.statusCode == 200){
//             response.data.forEach(function (value, index){
//               addPublicMessage({
//                 username: value.sender, 
//                 message: value.message, 
//                 timestamp: value.timestamp,
//                 userStatus: value.senderStatus
//               },false);
//             });
//           }
//           else{
//             BootstrapDialog.show({
//               title: 'Alert Message',
//               message: "bad database request."
//             });
//           }
//         });
//       });
//     }
//      function updateUserList(){
//       //clear off userlist
//       $userlist.children(".media.conversation").remove();
  
//       console.log("online: "+online_user);
//       console.log("offline: "+offline_user);
//       console.log("userList: ",userList);
//       online_user.forEach(function (value,index) {
//         // console.log('userlist'+value);
        
//         addUserList(value,true,userList[value].userStatus);
//       });
//       offline_user.forEach(function (value,index) {
//         addUserList(value,false,userList[value].userStatus);
//=======
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
//>>>>>>> e3b1cc604fc8b1217b8c6f1750441855ebefa24f
      });
    });
  }

  function updateUserList() {
    // Clear off userlist
    $userlist.children(".media.conversation").remove();

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

// <<<<<<< HEAD
//     function addPublicMessage(data,flag){
//       var myDate = new Date(data.timestamp * 1000);
//       var time = (myDate.getMonth()+1)+'.'+myDate.getDate()+'  '+myDate.toLocaleTimeString();
//       var htmlDiv = '<div class="media msg "><a class="pull-left"><img class="media-object" data-src="holder.js/64x64" alt="64x64" style="width: 32px; height: 32px;" src="img/user-icon.png"></a>'+
//       '<div class="media-body"><small class="pull-right time">'+data.userStatus +' <i class="fa fa-clock-o"></i> '+   time+
//       '</small><h5 class="media-heading">'+data.username+'</h5><h5 class="col-lg-10">'+data.message+'</h5></div></div><br>';
//       $public_body.append(htmlDiv);
//       if(flag){
//         $public_body.animate({scrollTop: $public_body[0].scrollHeight}, 500);
//       }
//     }
//     /*<small class="pull-right time"><i class="fa fa-clock-o"></i>*/
//     function addAnnouncementMessage(data,flag){
//       var myDate = new Date(data.timestamp * 1000);
//       var time = (myDate.getMonth()+1)+'.'+myDate.getDate()+'  '+myDate.toLocaleTimeString();
//       var htmlDiv = '<div class="media msg "><a class="pull-left" ></a>'+
//       '<h5 div class="media-body">'+time+'</h5><h5 class="media-heading">'+data.sender+'</h5><h4 class="col-lg-10">'
//       +data.message+'</h4></div></div><br>';
//       $announcement_body.append(htmlDiv);
//       /*if(flag){
//         $announcement_body.animate({scrollTop: $announcement_body[0].scrollHeight}, 500);
//       }*/
//     }
//     //get all users from REST GET
//     $.get("/users",
//     function(response){
//       if(response.statusCode == 200){
//         userList = response;
//         delete userList.statusCode;
//         console.log("userList: ",userList);
//         for(key in userList){
//           if(userList[key].online == 1){
//             userList[key].online = true;
//             // userList[key].userStatus = userList.userStatus;
//             online_user.push(key);
//             //add online user first
//             addUserList(key,true,userList[key].userStatus);
//           }
//           else{
//             offline_user.push(key);
//             userList[key].online = false;
//             //addUserList(key,false);
//           }
//         }
//         //then offline user
//         for(key in userList){
//           if(userList[key].online == false){
//             addUserList(key,false,userList[key].userStatus);
//           }
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
//>>>>>>> e3b1cc604fc8b1217b8c6f1750441855ebefa24f
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

// <<<<<<< HEAD
//     //public_button
//     $("#public_button").click(function(event){
//       event.preventDefault();
//       chat_flag = true;// post method turn to private chat
//       console.log("chat_flag : "+chat_flag);
//       $('#refresh-wrap').empty();
//       $('#refresh-wrap').append('<a id="refresh" class="btn col-xs-1 pull-right" role="button" style="color: #fff;"><span class="glyphicon glyphicon-refresh" aria-hidden="true"></span></a>');
//       $public_body.empty();
//       // $refresh.css("visibility","visible");
//       //re-initial
//       load_time = initial_loadtime;
//       newID = 9999999;
//       //get all public messages
//       $.get("/getPublicMessages",{
//         start: load_time,
//         ID: newID
//       },
//       function(response){
//         if(response.statusCode === 200){
//           load_time = response.newtime;
//           newID = response.newID;
//           response.data.forEach(function(value,index){
// =======
    getPublicMessages();
  });
//>>>>>>> e3b1cc604fc8b1217b8c6f1750441855ebefa24f

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

// <<<<<<< HEAD
//     //chat post button
//     $public_post.click(function(event) {
//       event.preventDefault();
//       var message = $public_message.val().trim();
//       if(message && chat_flag){
//         socket.emit('new public message',{username: username,message: message,userStatus: userList[username].userStatus});
//       }
//       else if(message && !chat_flag){
//         console.log("r: ",receiver);
//         console.log("s: ",username);
//         socket.emit('new private message',{sender: username, receiver: receiver, senderStatus: userList[username].userStatus, message:message});
//       }
//       else{
//         BootstrapDialog.show({
//             title: 'Alert Message',
//             message: 'Cannot input empty message!'
//         });
//         //alert("cannot input empty message");
//       }
//       $public_message.val('');           
//     });
      

//     $("#save_action").click(function(event) {
//       event.preventDefault();
//       //console.log('save action in');
//       var message = $announcement_message.val().trim();
//       if(message){
//         socket.emit('new announcement',{username:username,message:message});
//       }
//       else{
//         BootstrapDialog.show({
//             title: 'Alert Message',
//             message: 'Cannot input empty message!'
//         });
//         //alert("cannot input empty message");
//       }
//       $announcement_message.val('');     
//     });
// =======
    $public_message.val('');
  }

  // Send message button
  // TODO: rename public_post into post_message button
  $public_post.click(function (event) {
    event.preventDefault();
    postMessage();
  });

//>>>>>>> e3b1cc604fc8b1217b8c6f1750441855ebefa24f

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

  // Get another 20 messages
  $refresh.click(function (event) {
    event.preventDefault();
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


// <<<<<<< HEAD
//     $("#status-emergency").click(function(event) {
//       /* Act on the event */
//       event.preventDefault();
//       console.log('in Emergency');
//       // safety_status='Emergency';
//       userList[username].userStatus = 'Emergency';
//       updateUserList();
//       socket.emit('share status',{username:username,userStatus:'Emergency'});
// =======
  function updateStatus(newStatus) {
    userList[username].userStatus = newStatus;
    updateUserList();
    socket.emit('share status', {
      username: username,
      userStatus: newStatus
//>>>>>>> e3b1cc604fc8b1217b8c6f1750441855ebefa24f
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

// <<<<<<< HEAD
//     $("#status-help").click(function(event) {
//       /* Act on the event */
//       event.preventDefault();
//       console.log('in help');
//       // safety_status='Help';
//       userList[username].userStatus = 'Help';
//       updateUserList();
//       socket.emit('share status',{username:username,userStatus:'Help'});
//     });
// =======
// >>>>>>> e3b1cc604fc8b1217b8c6f1750441855ebefa24f

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
