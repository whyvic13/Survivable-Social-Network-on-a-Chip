
//var socket = io();
$(document).ready(function() {

  var $public_post = $("#public_post")
      $public_message = $("#public_message")
      $userlist = $("#userlist")
      $public_body = $("#public_body")    
  var load_time = Date.parse(new Date()) / 1000;
  var userList = {};//save up all the registered user
            //{username:"XXX", online_status: true or false}


  // Prevents input from having injected markup
  function cleanInput (input) {
    return $('<div/>').text(input).text();
  }

  function addUserList(username,status) {
    var online_status = status? " online" : "";
    var htmlDiv = '<div class="media conversation">'+
    '<a class="pull-left" href="#"><img class="media-object" data-src="holder.js/64x64" alt="64x64" style="width: 50px; height: 50px;" src="img/user-icon.png"></a>'+
    '<div class="media-body"><h5 class="media-heading">'+username+
    '</h5><span class="contact__status'+online_status+'"></span></div></div>';
    $userlist.append(htmlDiv).animate({scrollTop: $userlist[0].scrollHeight}, 500);
  }

  function updateUserList(username,status){
    //clear off userlist
    $userlist.empty();
    //re-add userlist
    for(var i in userList){
      if(userList[i].username === username){
        userList[i].online_status = status; 
      }
      addUserList(userList[i].username,userList[i].online_status);
    }
    
  }

  function addPublicMessage(data){
    var htmlDiv = '<div class="media msg "><a class="pull-left" href="#"><img class="media-object" data-src="holder.js/64x64" alt="64x64" style="width: 32px; height: 32px;" src="img/user-icon.png"></a>'+
    '<div class="media-body"><small class="pull-right time"><i class="fa fa-clock-o"></i> '+data.timestamp+
    '</small><h5 class="media-heading">'+data.username+'</h5><small class="col-lg-10">'+data.message+'</small></div></div><div class="alert alert-info msg-date"></div>';
    $public_body.append(htmlDiv);
    $public_body.animate({scrollTop: $public_body[0].scrollHeight}, 500);
  }

  /*
  //get all users from REST GET
  $.get("/users",
  function(response,status){
    if(status === 200){
      userList = response;
      for(key in userList){
        if(userList[key] === 1){
          userList[key] = true;
          addUserList(key,true);
        }
        else{
          userList[key] = false;
          addUserList(key,false);
        }
      }
    }
    else{
      alert("bad database request.");
    }
  });

  //get all public messages
  $.get("/getPublicMessages",{
    start: load_time
  },
  function(response,status){
    if(status === 200){
      response.forEach(function(value,index){
        addPublicMessage({
          username: value.sender,
          message: value.message,
          timestamp: value.timestamp
        });
      });
    }
    else{
      alert("bad database request.");
    }
  });
*/
  //public chat
  $public_post.click(function(event) {
    event.preventDefault();
    var username = "wdc";
    var message = $public_message.val().trim();
    var timestamp = "09:15am"
    message = cleanInput(message);
    //if there is non-empty message
    if(message){      
      addPublicMessage({
        username:username,
        message:message,
        timestamp:timestamp
      });
    }
    $public_message.val('');
    //addUserList(username,true);//for test
    //socket.emit('new public message',{username:username,message:message});
  });

    
    //socket event
    // Whenever the server emits 'new message', update the chat body
    socket.on('new public message', function (data) {//data{username:,timestamp:,message:}
        addPublicMessage(data);
    });
    // Whenever the server emits 'user joined', log it in the chat body
    socket.on('user join', function (username) {
        console.log(username + ' joined');
        if (userList.hasOwnProperty(username)){
          updateUserList(username,true);
        }
        else{
          addUserList(username,true);
        }
    });

      // Whenever the server emits 'user left', log it in the chat body
    socket.on('user left', function (username) {
        console.log(username + ' left');
        userList.username = false;
        updateUserList(username,false);
    });

});
