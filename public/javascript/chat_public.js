

$(document).ready(function() {
    var socket = io.connect();
    var $public_post = $("#public_post")
        $public_message = $("#public_message")
        //$userlist = $("#userlist")
        $userlist = $(".sidebar-nav")
        $public_body = $("#public_body") 
        $logout = $("#logout")   
        $userlist_head = $(".userlist_head")
        $refresh = $("#refresh")
        $save_action = $("#save_action")
        $announcement_message = $("#announcement_message")
        $announcement_body = $("#announcement_body");
    var chat_flag = true;// true for public_post, false for private_post
    var chat_target = "";
    var receiver = "";
    var load_time = Date.parse(new Date()) / 1000;
    var initial_loadtime = load_time;
    console.log(initial_loadtime);
    var newID = 99999999;
    var href = window.location.href;
    var parameters = href.split('?')[1].split('=')[1];
    var username = parameters.split('&')[0];
    //    username.safety_status='Undefined';
    var isNewUser = parameters.split('&')[1];
    $userlist_head.append("<h3>Welcome "+username+" !");
    if(isNewUser == "1"){
      $('#welcome_message').show();
    }
    var userList = {};//save up all the registered user
              //{username:"XXX", online_status: true or false}
    var online_user = [];
    var offline_user = [];
    // var safety_status='Undefined';

    //var announcement = {};//save all announcement

    // Emits user join event
    socket.emit("user join", username);

    // Prevents input from having injected markup
    function cleanInput (input) {
      return $('<div/>').text(input).text();
    }

    function addUserList(user,status,safety_status) {
      //
      var online_status = status? " online" : "";
      var safety = safety_status;
      if(safety == 'OK') { 
        // green 'Ok'
        var $htmlDiv = $('<div class="media conversation">'+
        '<a class="btn pull-left" role="button"><img class="media-object" data-src="holder.js/64x64" alt="64x64" style="width: 30px; height: 30px;" src="img/user-icon.png"></a>'+
        '<div class="media-body"><h5 class="media-heading">'+user+
        '</h5><span class="glyphicon glyphicon-user'+online_status+'"></span><a class="btn btn-success pull-right" ><i class="fa fa-check-square"></i></a></div></div>');}
      else if(safety == 'Emergency'){
        //yellow 'Emergency'
        var $htmlDiv = $('<div class="media conversation">'+
        '<a class="btn pull-left" role="button"><img class="media-object" data-src="holder.js/64x64" alt="64x64" style="width: 30px; height: 30px;" src="img/user-icon.png"></a>'+
        '<div class="media-body"><h5 class="media-heading">'+user+
        '</h5><span class="glyphicon glyphicon-user'+online_status+'"></span><a class="btn btn-warning pull-right" ><i class="fa fa-check-square"></i></a></div></div>');}
      else if(safety == 'Help'){
        //red 'Help'
        var $htmlDiv = $('<div class="media conversation">'+
        '<a class="btn pull-left" role="button"><img class="media-object" data-src="holder.js/64x64" alt="64x64" style="width: 30px; height: 30px;" src="img/user-icon.png"></a>'+
        '<div class="media-body"><h5 class="media-heading">'+user+
        '</h5><span class="glyphicon glyphicon-user'+online_status+'"></span><a class="btn btn-danger pull-right" ><i class="fa fa-check-square"></i></a></div></div>');}
      else{
        var $htmlDiv = $('<div class="media conversation">'+
        '<a class="btn pull-left" role="button"><img class="media-object" data-src="holder.js/64x64" alt="64x64" style="width: 30px; height: 30px;" src="img/user-icon.png"></a>'+
        '<div class="media-body"><h5 class="media-heading">'+user+
        '</h5><span class="glyphicon glyphicon-user'+online_status+'"></span></div></div>');}
      $userlist.append($htmlDiv);

      //click function
      $htmlDiv.children(".btn.pull-left").click(function(event){
        event.preventDefault();
        receiver = $(this).siblings(".media-body").text();
        chat_flag = false;// post method turn to private chat
  
        $public_body.empty();
        $('#refresh-wrap').empty();
        $("#refresh-wrap").append('<label class="pull-right"><h4>'+receiver+'</h4></label>');
        // $("#refresh-wrap").append('<a id="public_button" class="navbar-custom btn  pull-left" role="button" ><i class="fa fa-play-circle"></i> Back</a>');
        // $refresh.css("visibility","hidden");

        
        $.get("/getPrivateMessages",{
          sender: username,
          receiver: receiver
        },
        function(response){
          // console.log(response);
          if(response.statusCode == 200){
            response.data.forEach(function (value, index){
              addPublicMessage({
                username: value.sender, 
                message: value.message, 
                timestamp: value.timestamp,
                userStatus: value.senderStatus
              },false);
            });
          }
          else{
            BootstrapDialog.show({
              title: 'Alert Message',
              message: "bad database request."
            });
          }
        });
      });
    }
     function updateUserList(){
      //clear off userlist
      $userlist.children(".media.conversation").remove();
      //re-add userlist
      /*userList[username] = status;
      console.log(userList);
      for(var key in userList){
        addUserList(key, userList[key]);
      }*/
      // var safety=safety_status;
      
      //console.log('in update'+ safety_status+username);
      console.log("online: "+online_user);
      console.log("offline: "+offline_user);
      console.log("userList: ",userList);
      online_user.forEach(function (value,index) {
        // console.log('userlist'+value);
        
        addUserList(value,true,userList[value].userStatus);
      });
      offline_user.forEach(function (value,index) {
        addUserList(value,false,userList[value].userStatus);
      });
      
    }


    function addPublicMessage(data,flag){
      var myDate = new Date(data.timestamp * 1000);
      var time = (myDate.getMonth()+1)+'.'+myDate.getDate()+'  '+myDate.toLocaleTimeString();
      var htmlDiv = '<div class="media msg "><a class="pull-left"><img class="media-object" data-src="holder.js/64x64" alt="64x64" style="width: 32px; height: 32px;" src="img/user-icon.png"></a>'+
      '<div class="media-body"><small class="pull-right time">'+data.userStatus +' <i class="fa fa-clock-o"></i> '+   time+
      '</small><h5 class="media-heading">'+data.username+'</h5><h5 class="col-lg-10">'+data.message+'</h5></div></div><br>';
      $public_body.append(htmlDiv);
      if(flag){
        $public_body.animate({scrollTop: $public_body[0].scrollHeight}, 500);
      }
    }
    /*<small class="pull-right time"><i class="fa fa-clock-o"></i>*/
    function addAnnouncementMessage(data,flag){
      var myDate = new Date(data.timestamp * 1000);
      var time = (myDate.getMonth()+1)+'.'+myDate.getDate()+'  '+myDate.toLocaleTimeString();
      var htmlDiv = '<div class="media msg "><a class="pull-left" ></a>'+
      '<h5 div class="media-body">'+time+'</h5><h5 class="media-heading">'+data.sender+'</h5><h4 class="col-lg-10">'
      +data.message+'</h4></div></div><br>';
      $announcement_body.append(htmlDiv);
      /*if(flag){
        $announcement_body.animate({scrollTop: $announcement_body[0].scrollHeight}, 500);
      }*/
    }
    //get all users from REST GET
    $.get("/users",
    function(response){
      if(response.statusCode == 200){
        userList = response;
        delete userList.statusCode;
        console.log("userList: ",userList);
        for(key in userList){
          if(userList[key].online == 1){
            userList[key].online = true;
            // userList[key].userStatus = userList.userStatus;
            online_user.push(key);
            //add online user first
            addUserList(key,true,userList[key].userStatus);
          }
          else{
            offline_user.push(key);
            userList[key].online = false;
            //addUserList(key,false);
          }
        }
        //then offline user
        for(key in userList){
          if(userList[key].online == false){
            addUserList(key,false,userList[key].userStatus);
          }
        }
      }
      else{
        BootstrapDialog.show({
          title: 'Alert Message',
          message: "bad database request."
        });
        //alert("bad database request.");
      }

    });

    //get all public messages
    $.get("/getPublicMessages",{
      start: load_time,
      ID: newID
    },
    function(response){
      console.log(response);
      if(response.statusCode === 200){
        load_time = response.newtime;
        newID = response.newID;

        console.log("load_time: ",load_time);
        response.data.forEach(function(value,index){

          addPublicMessage({
            username: value.sender,
            message: value.message,
            timestamp: value.timestamp,
            userStatus: value.senderStatus
          },
          false);
        });
      }
      else if(response.statusCode === 401){
        BootstrapDialog.show({
            title: 'Alert Message',
            message: response.message
          });
        //alert(response.message);
      }
      else{
        BootstrapDialog.show({
            title: 'Alert Message',
            message: response.message
        });
        //alert("bad database request.");
      }
    });

    //get Announcement messages
    $.get("/getAnnoucements",
      function(response){
      console.log('in getAnnoucements');
      if(response.statusCode === 200){

        response.data.forEach(function(value,index){

          addAnnouncementMessage({
            sender: value.sender,
            message: value.message,
            timestamp: value.timestamp
          },
          false);
        });
      }
      else if(response.statusCode === 401){
        BootstrapDialog.show({
            title: 'Alert Message',
            message: response.message
          });
        //alert(response.message);
      }
      else{
        BootstrapDialog.show({
            title: 'Alert Message',
            message: response.message
        });
        //alert("bad database request.");
      }
    });

    //public chat

    //public_button
    $("#public_button").click(function(event){
      event.preventDefault();
      chat_flag = true;// post method turn to private chat
      console.log("chat_flag : "+chat_flag);
      $('#refresh-wrap').empty();
      $('#refresh-wrap').append('<a id="refresh" class="btn col-xs-1 pull-right" role="button" style="color: #fff;"><span class="glyphicon glyphicon-refresh" aria-hidden="true"></span></a>');
      $public_body.empty();
      // $refresh.css("visibility","visible");
      //re-initial
      load_time = initial_loadtime;
      newID = 9999999;
      //get all public messages
      $.get("/getPublicMessages",{
        start: load_time,
        ID: newID
      },
      function(response){
        if(response.statusCode === 200){
          load_time = response.newtime;
          newID = response.newID;
          response.data.forEach(function(value,index){

            addPublicMessage({
              username: value.sender,
              message: value.message,
              timestamp: value.timestamp,
              userStatus: value.senderStatus
            },
            false);
          });
        }
        else if(response.statusCode === 401){
          BootstrapDialog.show({
              title: 'Alert Message',
              message: response.message
            });
          //alert(response.message);
        }
        else{
          BootstrapDialog.show({
              title: 'Alert Message',
              message: response.message
          });
          //alert("bad database request.");
        }
      });
    });

    //chat post button
    $public_post.click(function(event) {
      event.preventDefault();
      var message = $public_message.val().trim();
      if(message && chat_flag){
        socket.emit('new public message',{username: username,message: message,userStatus: userList[username].userStatus});
      }
      else if(message && !chat_flag){
        console.log("r: ",receiver);
        console.log("s: ",username);
        socket.emit('new private message',{sender: username, receiver: receiver, senderStatus: userList[username].userStatus, message:message});
      }
      else{
        BootstrapDialog.show({
            title: 'Alert Message',
            message: 'Cannot input empty message!'
        });
        //alert("cannot input empty message");
      }
      $public_message.val('');           
    });
      

    $("#save_action").click(function(event) {
      event.preventDefault();
      //console.log('save action in');
      var message = $announcement_message.val().trim();
      if(message){
        socket.emit('new announcement',{username:username,message:message});
      }
      else{
        BootstrapDialog.show({
            title: 'Alert Message',
            message: 'Cannot input empty message!'
        });
        //alert("cannot input empty message");
      }
      $announcement_message.val('');     
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
          BootstrapDialog.show({
            title: 'Alert Message',
            message: response.message
          });
          //alert(response.message);
        }
        else{
          BootstrapDialog.show({
            title: 'Alert Message',
            message: response.message
          });
          //alert(response.message);
        }
      });
    });

    //logout
    $logout.click(function(event){
      event.preventDefault();
      $.get("/user/logout",{
          username: username
        },
        function(response){
          console.log("response: "+response);
          console.log("user left"+username);
          socket.emit("user left",username);
          window.location.href = "/";
        }
      );
    });

    
    //click to toggle side_menu
    $("#menu-toggle").click(function(e) {
        e.preventDefault();
        $("#wrapper").toggleClass("toggled");
    });

    $("#status-ok").click(function(event) {
      /* Act on the event */
      event.preventDefault();
      console.log('in ok');
      // safety_status='OK';
      userList[username].userStatus = 'OK';
      updateUserList();
      socket.emit('share status',{username:username,userStatus:'OK'});
    });

    $("#status-emergency").click(function(event) {
      /* Act on the event */
      event.preventDefault();
      console.log('in Emergency');
      // safety_status='Emergency';
      userList[username].userStatus = 'Emergency';
      updateUserList();
      socket.emit('share status',{username:username,userStatus:'Emergency'});
    });

    $("#status-help").click(function(event) {
      /* Act on the event */
      event.preventDefault();
      console.log('in help');
      // safety_status='Help';
      userList[username].userStatus = 'Help';
      updateUserList();
      socket.emit('share status',{username:username,userStatus:'Help'});
    });

    //socket event
    // Whenever the server emits 'new message', update the chat body
    socket.on('new private message', function (data) {
      console.log("private: ", data);
      console.log("flag: ",chat_flag);
      if(data.sender == username){
        addPublicMessage({
          username: data.sender, 
          timestamp: data.timestamp, 
          message: data.message,
          userStatus: data.senderStatus
        }, true);;
      }
      else if(data.sender == receiver){
        if(!chat_flag){
          addPublicMessage({
            username: data.sender, 
            timestamp: data.timestamp, 
            message: data.message,
            userStatus: data.senderStatus
          }, true);
        }
        else{
          BootstrapDialog.show({
            title: 'Alert Message',
            message: "message from : "+data.sender,
          });
        }
      }
      else{
        BootstrapDialog.show({
          title: 'Alert Message',
          message: "message from : "+data.sender,
        });
      }    
      
    });

    socket.on('new public message', function (data) {//data{username:,timestamp:,message:}
        addPublicMessage({
          username: data.username,
          timestamp: data.timestamp,
          message: data.message,
          userStatus: data.senderStatus
        },true);
    });
    socket.on('new announcement', function (data) {//data{username:,timestamp:,message:}
        addAnnouncementMessage(data,true);
    });

    socket.on('status update', function(data) {
      console.log("status update: ",data);
      userList[data.username].userStatus = data.userStatus;
      updateUserList();
    });
    // Whenever the server emits 'user joined', log it in the chat body
    socket.on('user join', function (username) {
        console.log(username + ' joined');
        
        if (username in userList){
            console.log("update user list");
            //push username to online_user, 
            if(online_user.indexOf(username) == -1){
              online_user.push(username);
              //case insensitive sort
              online_user.sort(function (a, b) {
                  return a.toLowerCase().localeCompare(b.toLowerCase());
              });
              //delete from offline_user
              var index = offline_user.indexOf(username);
              offline_user.splice(index,1);
              
          }  
          userList[username].online = true;
          //update new user
          updateUserList();      
          
        }
        else{
          console.log("add user List");
          if(online_user.indexOf(username) == -1){
            //push username to online_user, 
            online_user.push(username);
            //case insensitive sort
            online_user.sort(function (a, b) {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            });
          }
          userList[username] = {online:true, userStatus:null};
          updateUserList();
        }

        console.log("new userList: ",userList);

    });

      // Whenever the server emits 'user left', log it in the chat body
    socket.on('user left', function (username) {
        console.log(username + ' left');
        //push username to online_user, 
        offline_user.push(username);
        //case insensitive sort
        offline_user.sort(function (a, b) {
            return a.toLowerCase().localeCompare(b.toLowerCase());
        });
        //delete from offline_user
        var index = online_user.indexOf(username);
        online_user.splice(index,1);
        //update new user
        updateUserList();
    });

});
