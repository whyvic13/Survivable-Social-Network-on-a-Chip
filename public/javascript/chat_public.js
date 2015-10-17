

$(document).ready(function() {
    var socket = io();
    var $public_post = $("#public_post")
        $public_message = $("#public_message")
        //$userlist = $("#userlist")
        $userlist=$(".sidebar-nav")
        $public_body = $("#public_body") 
        $logout = $("#logout")   
        $userlist_head = $(".userlist_head")
        $refresh = $("#refresh");
    var load_time = Date.parse(new Date()) / 1000;
    var newID = 99999999;
    var href = window.location.href;
    var parameters = href.split('?')[1].split('=')[1];
    var username = parameters.split('&')[0];
    var isNewUser = parameters.split('&')[1];
    $userlist_head.append("<h3>Welcome "+username+" !");
    if(isNewUser == "1"){
      $('#welcome_message').show();
    }
    var userList = {};//save up all the registered user
              //{username:"XXX", online_status: true or false}
    var online_user = [];
    var offline_user = [];


    // Prevents input from having injected markup
    function cleanInput (input) {
      return $('<div/>').text(input).text();
    }

    function addUserList(username,status) {
      var online_status = status? " online" : "";
      var htmlDiv = '<div class="media conversation">'+
      '<a class="pull-left" href="/public/chat_private.html"><img class="media-object" data-src="holder.js/64x64" alt="64x64" style="width: 30px; height: 30px;" src="img/user-icon.png"></a>'+
      '<div class="media-body"><h5 class="media-heading" href="/public/chat_private.html">'+username+
      '</h5><span class="glyphicon glyphicon-user'+online_status+'"></span></div></div>';
      $userlist.append(htmlDiv);
    }

    function updateUserList(username,status){
      //clear off userlist
      $userlist.empty();
      //re-add userlist
      /*userList[username] = status;
      console.log(userList);
      for(var key in userList){
        addUserList(key, userList[key]);
      }*/
      console.log("online: "+online_user);
      console.log("offline: "+offline_user);
      online_user.forEach(function (value,index) {
        addUserList(value,true);
      });
      offline_user.forEach(function (value,index) {
        addUserList(value,false);
      });
      
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

    function addAnouncementMessage(data,flag){
      var myDate = new Date(data.timestamp * 1000);
      var time = (myDate.getMonth()+1)+'.'+myDate.getDate()+'  '+myDate.toLocaleTimeString();
      var htmlDiv = '<div class="media msg "><a class="pull-left" href="#"><img class="media-object" data-src="holder.js/64x64" alt="64x64" style="width: 32px; height: 32px;" src="img/user-icon.png"></a>'+
      '<div class="media-body"><small class="pull-right time"><i class="fa fa-clock-o"></i> '+time+
      '</small><h5 class="media-heading">'+data.username+'</h5><small class="col-lg-10">'+data.message+'</small></div></div><div class="alert alert-info msg-date"></div>';
      $announcement_body.append(htmlDiv);
      if(flag){
        $announcement_body.animate({scrollTop: $public_body[0].scrollHeight}, 500);
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
            online_user.push(key);
            addUserList(key,true);
          }
          else{
            offline_user.push(key);
            userList[key] = false;
            //addUserList(key,false);
          }
        }
        //add online user first
        //then offline user
        for(key in userList){
          if(userList[key] == false){
            addUserList(key,false);
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
    $public_post.click(function(event) {
      event.preventDefault();
      
      var message = $public_message.val().trim();
      if(message){
        socket.emit('new public message',{username:username,message:message});
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

    /* Chat_box Not use for now
    var toggle = false;
    var user="jQuery404";
    var searchBoxText= "Type here...";
    var fixIntv;
    var fixedBoxsize = $('#fixed').outerHeight()+'px';
    var Parent = $("#fixed"); // cache parent div
    var Header = $(".fixedHeader"); // cache header div
    var Chatbox = $(".userinput"); // cache header div
    Parent.css('height', '30px');

    Header.click(function(){           
    toggle = (!toggle) ? true : false;
    if(toggle)
    {
        Parent.animate({'height' : fixedBoxsize}, 300);                    
    }
    else
    {
        Parent.animate({'height' : '30px'}, 300); 
    }
    });

    Chatbox.focus(function(){
    $(this).val(($(this).val()==searchBoxText)? '' : $(this).val());
      }).blur(function(){
    $(this).val(($(this).val()=='')? searchBoxText : $(this).val());
      }).keyup(function(e){
    var code = (e.keyCode ? e.keyCode : e.which);       
    if(code==13){
        $('.fixedContent').append("<div class='userwrap'><span class='user'>"+user+"</span><span class='messages'>"+$(this).val()+"</span></div>");
        event.preventDefault();
     
        $(".fixedContent").scrollTop($(".fixedContent").height());
        $(this).val('');
      }    
    });*/

    //socket event
    // Whenever the server emits 'new message', update the chat body
    socket.on('new public message', function (data) {//data{username:,timestamp:,message:}
        addPublicMessage(data,true);
    });
    // Whenever the server emits 'user joined', log it in the chat body
    socket.on('user join', function (username) {
        console.log(username + ' joined');
        userList[username] = true;
        if (username in userList){
          console.log("update user list");
          //push username to online_user, 
          online_user.push(username);
          //case insensitive sort
          online_user.sort(function (a, b) {
              return a.toLowerCase().localeCompare(b.toLowerCase());
          });
          //delete from offline_user
          var index = offline_user.indexOf(username);
          offline_user.splice(index,1);
          //update new user
          updateUserList();
        }
        else{
          console.log("add user List");
          //push username to online_user, 
          online_user.push(username);
          //case insensitive sort
          online_user.sort(function (a, b) {
              return a.toLowerCase().localeCompare(b.toLowerCase());
          });
          updateUserList();
        }
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
