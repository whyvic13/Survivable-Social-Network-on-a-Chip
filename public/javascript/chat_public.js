

$(document).ready(function() {
  var socket = io();
  var $public_post = $("#public_post")
      $public_message = $("#public_message")
      $userlist = $("#userlist")
      $public_body = $("#public_body") 
      $logout = $("#logout")   
      $userlist_head = $(".userlist_head")
      $refresh = $("#refresh");
  var load_time = Date.parse(new Date()) / 1000;
  var newID = Number.MAX_SAFE_INTEGER;
  var href = window.location.href;
  var username = href.split('?')[1].split('=')[1];
  $userlist_head.append("<h3>Welcome "+username+" !");
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
    $userlist.append(htmlDiv);
  }

  function updateUserList(username,status){
    //clear off userlist
    $userlist.empty();
    //re-add userlist
    userList[username] = status;
    console.log(userList);
    for(var key in userList){
      addUserList(key, userList[key]);
    }
    
  }

  function addPublicMessage(data,flag){
    var myDate = new Date(data.timestamp * 1000);
    var time = (myDate.getMonth()+1)+'.'+myDate.getDate()+'  '+myDate.toLocaleTimeString();
    var htmlDiv = '<div class="media msg "><a class="pull-left" href="#"><img class="media-object" data-src="holder.js/64x64" alt="64x64" style="width: 32px; height: 32px;" src="img/user-icon.png"></a>'+
    '<div class="media-body"><small class="pull-right time"><i class="fa fa-clock-o"></i> '+time+
    '</small><h5 class="media-heading">'+data.username+'</h5><small class="col-lg-10">'+data.message+'</small></div></div><div class="alert alert-info msg-date"></div>';
    $public_body.append(htmlDiv);
    if(flag){
      $public_body.animate({scrollTop: $public_body[0].scrollHeight}, 500);
    }
  }

  
  //get all users from REST GET
  $.get("/users",
  function(response){
    if(response.statusCode == 200){
      userList = response;
      delete userList.statusCode;
      console.log(userList);
      for(key in userList){
        if(userList[key] == true){
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
    start: load_time,
    ID: newID
  },
  function(response){
    if(response.statusCode === 200){
      load_time = response.newtime;
      newID = response.newID;
      //
      console.log("newtime: "+load_time);
      console.log("newID: "+newID);
      response.data.forEach(function(value,index){

        addPublicMessage({
          username: value.sender,
          message: value.message,
          timestamp: value.timestamp
        },
        false);
      });
    }
    else{
      alert("bad database request.");
    }
  });

  //public chat
  $public_post.click(function(event) {
    event.preventDefault();
    
    var message = $public_message.val().trim();
    if(message){
      socket.emit('new public message',{username:username,message:message});
    }
    else{
      alert("cannot input empty message");
    }
    $public_message.val('');
    // //if there is non-empty message
    // if(message){      
    //   addPublicMessage({
    //     username:username,
    //     message:message,
    //     timestamp:timestamp
    //   });
    // }
    
    // addUserList(username,false);//for test
    
  });

    //get another 20 messages
    $refresh.click(function(event){
      event.preventDefault();

      $.get("/getPublicMessages",{
        start: load_time,
        ID: newID
      },
      function(response){
        if(response.statusCode === 200){
          load_time = response.newtime;
          newID = response.newID;
          //
          console.log(load_time);
          var i = response.data.length;
          for(i--;i>=0;i--){
            console.log("refresh!");
            var item = response.data[i];
            var myDate = new Date(item.timestamp * 1000);
            var time = (myDate.getMonth()+1)+'.'+myDate.getDate()+'  '+myDate.toLocaleTimeString();
            var htmlDiv = '<div class="media msg "><a class="pull-left" href="#"><img class="media-object" data-src="holder.js/64x64" alt="64x64" style="width: 32px; height: 32px;" src="img/user-icon.png"></a>'+
            '<div class="media-body"><small class="pull-right time"><i class="fa fa-clock-o"></i> '+time+
            '</small><h5 class="media-heading">'+item.sender+'</h5><small class="col-lg-10">'+item.message+'</small></div></div><div class="alert alert-info msg-date"></div>';
            $public_body.prepend(htmlDiv);
          }
          
          $public_body.animate({scrollTop: 0}, 500);
        }
        else if(response.statusCode === 401){
          alert(response.message);
        }
        else{
          alert(response.message);
        }
      });
    });
    //socket event
    // Whenever the server emits 'new message', update the chat body
    socket.on('new public message', function (data) {//data{username:,timestamp:,message:}
        addPublicMessage(data,true);
    });
    // Whenever the server emits 'user joined', log it in the chat body
    socket.on('user join', function (username) {
        console.log(username + ' joined');
        // console.log(username in userList);
        if (username in userList){
          console.log("update user list");
          updateUserList(username,true);
        }
        else{
          console.log("add user List");
          userList[username] = true;
          // console.log(userList);
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
