

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
    
    var chat_target = "";
    var receiver = "";
    var load_time = Date.parse(new Date()) / 1000;
    var initial_loadtime = load_time;

    var newID = 99999999;
    var href = window.location.href;
    var parameters = href.split('?')[1].split('=')[1];
    var username = parameters.split('&')[0];
    var isNewUser = parameters.split('&')[1];
    $("#head_title").append("<h3>WELCOME "+username+" !</h3>");
    if(isNewUser == "1"){
      $('#welcome_message').show();
    }
    var userList = {};//save up all the registered user
              //
    var online_user = [];
    var offline_user = [];

    // Emits user join event
    socket.emit("user join", username);

    // Prevents input from having injected markup
    function cleanInput (input) {
      return $('<div/>').text(input).text();
    }

    function addUserList(user,status,safety_status) {
      //
      var online_status = status? " online" : " offline";
      var safety = safety_status;
      if(safety == 'OK') { 
        // green 'Ok'
        var $htmlDiv = $('<tr><td><div class="round round-lg'+online_status+'"><span class="glyphicon glyphicon-user"></span></div>'+
                         '<a href="#" class="user-link">'+user+'</a></td><td class="text-center">'+
                         '<span class="label label-success">OK</span></td>');}
      else if(safety == 'Emergency'){
        //yellow 'Emergency'
        var $htmlDiv = $('<tr><td><div class="round round-lg'+online_status+'"><span class="glyphicon glyphicon-user"></span></div>'+
                         '<a href="#" class="user-link">'+user+'</a></td><td class="text-center">'+
                         '<span class="label label-warning">EMERGENCY</span></td>');}
      else if(safety == 'Help'){
        //red 'Help'
        var $htmlDiv = $('<tr><td><div class="round round-lg'+online_status+'"><span class="glyphicon glyphicon-user"></span></div>'+
                         '<a href="#" class="user-link">'+user+'</a></td><td class="text-center">'+
                         '<span class="label label-danger">HELP</span></td>');}
      else{
        var $htmlDiv = $('<tr><td><div class="round round-lg'+online_status+'"><span class="glyphicon glyphicon-user"></span></div>'+
                         '<a href="#" class="user-link">'+user+'</a></td><td class="text-center">'+
                         '<span class="label label-default">NONE</span></td>');}
      $userlist.append($htmlDiv);

      //click function
      // $htmlDiv.children(".btn.pull-left").click(function(event){
      //   event.preventDefault();
      //   receiver = $(this).siblings(".media-body").text();
      //   chat_flag = false;// post method turn to private chat
      //   $public_body.empty();
      //   $('#refresh-wrap').empty();
      //   $("#refresh-wrap").append('<a id="refresh" class="col-xs-3 pull-left"><h4>'+receiver+'</h4></a>');
      //   $refresh.css("visibility","hidden");

        
      //   $.get("/getPrivateMessages",{
      //     sender: username,
      //     receiver: receiver
      //   },
      //   function(response){
      //     // console.log(response);
      //     if(response.statusCode == 200){
      //       response.data.forEach(function (value, index){
      //         addPublicMessage({
      //           username: value.sender, 
      //           message: value.message, 
      //           timestamp: value.timestamp,
      //           userStatus: value.senderStatus
      //         },false);
      //       });
      //     }
      //     else{
      //       BootstrapDialog.show({
      //         title: 'Alert Message',
      //         message: "bad database request."
      //       });
      //     }
      //   });
      // });
    }
     function updateUserList(){
        //clear off userlist
        $userlist.empty();
        console.log("online: "+online_user);
        console.log("offline: "+offline_user);
        console.log("userList: ",userList);
        online_user.forEach(function (value,index) {
          addUserList(value,true,userList[value].userStatus);
        });
        offline_user.forEach(function (value,index) {
          addUserList(value,false,userList[value].userStatus);
        });
      
    }


    function addPublicMessage(data,flag){
      var myDate = new Date(data.timestamp * 1000);
      var time = (myDate.getMonth()+1)+'.'+myDate.getDate()+'  '+myDate.toLocaleTimeString();
      var safety = data.userStatus;
      if(safety == 'OK') { 
        // green 'Ok'
        var htmlDiv = '<li class="left clearfix"><span class="chat-img pull-left">'+
                    '<img src="http://placehold.it/50/55C1E7/fff&text=U" alt="User Avatar" class="img-circle" />'+
                    '</span><div class="chat-body clearfix">' +
                    '<div class="header"><strong class="primary-font">'+data.username+
                    '</strong> &nbsp;&nbsp;&nbsp;&nbsp;<span class="label label-success">OK</span><small class="pull-right text-muted"><span class="glyphicon glyphicon-time">'+
                    '</span>'+time+'</small></div>'+
                    '<p>'+data.message+'</p></div></li>';
      }
      else if(safety == 'Emergency'){
        //yellow 'Emergency'
        var htmlDiv = '<li class="left clearfix"><span class="chat-img pull-left">'+
                    '<img src="http://placehold.it/50/55C1E7/fff&text=U" alt="User Avatar" class="img-circle" />'+
                    '</span><div class="chat-body clearfix">' +
                    '<div class="header"><strong class="primary-font">'+data.username+
                    '</strong> &nbsp;&nbsp;&nbsp;&nbsp;<span class="label label-warning">EMERGENCY</span><small class="pull-right text-muted"><span class="glyphicon glyphicon-time">'+
                    '</span>'+time+'</small></div>'+
                    '<p>'+data.message+'</p></div></li>';
      }
      else if(safety == 'Help'){
        //red 'Help'
        var htmlDiv = '<li class="left clearfix"><span class="chat-img pull-left">'+
                    '<img src="http://placehold.it/50/55C1E7/fff&text=U" alt="User Avatar" class="img-circle" />'+
                    '</span><div class="chat-body clearfix">' +
                    '<div class="header"><strong class="primary-font">'+data.username+
                    '</strong> &nbsp;&nbsp;&nbsp;&nbsp;<span class="label label-danger">HELP</span><small class="pull-right text-muted"><span class="glyphicon glyphicon-time">'+
                    '</span>'+time+'</small></div>'+
                    '<p>'+data.message+'</p></div></li>';
      }
      else{
        var htmlDiv = '<li class="left clearfix"><span class="chat-img pull-left">'+
                    '<img src="http://placehold.it/50/55C1E7/fff&text=U" alt="User Avatar" class="img-circle" />'+
                    '</span><div class="chat-body clearfix">' +
                    '<div class="header"><strong class="primary-font">'+data.username+
                    '</strong> &nbsp;&nbsp;&nbsp;&nbsp;<span class="label label-default">NONE</span><small class="pull-right text-muted"><span class="glyphicon glyphicon-time">'+
                    '</span>'+time+'</small></div>'+
                    '<p>'+data.message+'</p></div></li>';
      }
     
      $public_body.append(htmlDiv);
      if(flag){
        $public_body.animate({scrollTop: $public_body[0].scrollHeight}, 500);
      }
    }


    function addPrivateMessage(data,flag){
      // flag true for own, false for other
      var myDate = new Date(data.timestamp * 1000);
      var time = (myDate.getMonth()+1)+'.'+myDate.getDate()+'  '+myDate.toLocaleTimeString();
      if(flag) {
         var htmlDiv = '<li class="right clearfix"><span class="chat-img pull-right">'+
                      '<img src="http://placehold.it/50/FA6F57/fff&text=ME" alt="User Avatar" class="img-circle" />'+
                      '</span><div class="chat-body clearfix"><div class="header">'+
                      '<small class=" text-muted"><span class="glyphicon glyphicon-time">'+
                      '</span>'+time+'</small><strong class="pull-right primary-font">'+data.username+
                      '</strong></div><p>'+data.message+'</p></div></li> ';
      }
      else {
        var htmlDiv = '<li class="left clearfix"><span class="chat-img pull-left">'+
                    '<img src="http://placehold.it/50/55C1E7/fff&text=U" alt="User Avatar" class="img-circle" />'+
                    '</span><div class="chat-body clearfix">' +
                    '<div class="header"><strong class="primary-font">'+data.username+
                    '</strong><small class="pull-right text-muted"><span class="glyphicon glyphicon-time">'+
                    '</span>'+time+'</small></div>'+
                    '<p>'+data.message+'</p></div></li>';
        
      }
      $private_body.append(htmlDiv);
      
    }

    function addAnnouncementMessage(data,flag){
      var myDate = new Date(data.timestamp * 1000);
      var time = (myDate.getMonth()+1)+'.'+myDate.getDate()+'  '+myDate.toLocaleTimeString();
      var htmlDiv = '<div class="media msg "><a class="pull-left" ></a>'+
      '<h5 div class="media-body">'+time+'</h5><h5 class="media-heading">'+data.sender+'</h5><h4 class="col-lg-10">'
      +data.message+'</h4></div></div><div class="alert alert-info msg-date"></div>';
      $announcement_body.append(htmlDiv);

    }

    function setDropdownUserlistClick(user) {
      var $htmlDiv = $('<li><a href="" id="chat-userlist"><span class="glyphicon glyphicon-user">'+
                     '</span>'+user+'</a></li>');
      $('#userlist-dropdown-append').append($htmlDiv);
      $htmlDiv.children('#chat-userlist').click(function(event) {
        event.preventDefault();
        receiver = $(this).text();
        console.log("receiver: "+receiver);
        // set chat name
        $('.glyphicon.glyphicon-comment').empty().append('   '+receiver);

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
                },true);
              }
              else {
                addPrivateMessage({
                  username: value.sender, 
                  message: value.message, 
                  timestamp: value.timestamp,
                  userStatus: value.senderStatus
                },false);
              }
              
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
    //get all users from REST GET
    $.get("/users",
    function(response){
      if(response.statusCode == 200){
        userList = response;
        delete userList.statusCode;
        console.log("userList: ",userList);
        for(key in userList){
          //userlist-toggle append
          setDropdownUserlistClick(key);
          
          //
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
      }
    });

    
    // public chat post button
    $public_post.click(function(event) {
      event.preventDefault();
      var message = $public_message.val().trim();
      if(message){
        socket.emit('new public message',{username: username,message: message,userStatus: userList[username].userStatus});
      }
      else{
        BootstrapDialog.show({
            title: 'Alert Message',
            message: 'Cannot input empty message!'
        });
      }
      $public_message.val('');
      
      
    });

    // private chat post button
    $private_post.click(function(event) {
      event.preventDefault();
      var message = $private_message.val().trim();
      if(message){
        socket.emit('new private message',{sender: username, receiver: receiver, senderStatus: userList[username].userStatus, message:message});
      }
      else{
        BootstrapDialog.show({
            title: 'Alert Message',
            message: 'Cannot input empty message!'
        });
      }
      $private_message.val('');
      
      
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
            var htmlDiv = '<li class="left clearfix"><span class="chat-img pull-left">'+
                    '<img src="http://placehold.it/50/55C1E7/fff&text=U" alt="User Avatar" class="img-circle" />'+
                    '</span><div class="chat-body clearfix">' +
                    '<div class="header"><strong class="primary-font">'+item.sender+
                    '</strong> &nbsp;&nbsp;&nbsp;&nbsp;<span class="label label-success">OK</span><small class="pull-right text-muted"><span class="glyphicon glyphicon-time">'+
                    '</span>'+time+'</small></div>'+
                    '<p>'+item.message+'</p></div></li>';
            // var htmlDiv = '<div class="media msg "><a class="pull-left" href="#"><img class="media-object" data-src="holder.js/64x64" alt="64x64" style="width: 32px; height: 32px;" src="img/user-icon.png"></a>'+
            // '<div class="media-body"><small class="pull-right time"><i class="fa fa-clock-o"></i> '+time+
            // '</small><h5 class="media-heading">'+item.sender+'</h5><small class="col-lg-10">'+item.message+'</small></div></div><div class="alert alert-info msg-date"></div>';
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

    $("#userlist-dropdwon").click(function(event) {
      for(key in userList) {
        var htmlDiv = '<li><a href="" id="'+key+'"><span class="glyphicon glyphicon-refresh">'+
                     '</span>Refresh</a></li>';
        $('#userlist-dropdown-append').append(htmlDiv);
      }
      
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
      if(data.sender == username){
        addPrivateMessage({
          username: data.sender, 
          timestamp: data.timestamp, 
          message: data.message,
          userStatus: data.senderStatus
        }, true);
      }
      else if(data.sender == receiver){
          addPrivateMessage({
            username: data.sender, 
            timestamp: data.timestamp, 
            message: data.message,
            userStatus: data.senderStatus
          }, false);
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
          console.log("add new user");
          if(online_user.indexOf(username) == -1){
            //push username to online_user, 
            online_user.push(username);
            //case insensitive sort
            online_user.sort(function (a, b) {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            });
          }
          userList[username] = {online:true, userStatus:null};
          setDropdownUserlistClick(username);
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
