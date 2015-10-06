
$(function() {
	 
    var $usernameInput = $('.form-username form-control'); // Input for username
    var $userPassword = $('#form-password');
    var $login = $('#login');
    var $signup = $('#signup');
    // Variables for Username invalidation

    //var socket = io();
    var username;
    var password;
    var nameFirstChar;
    var nameLastChar;
    var position;
    var nameRegx = /^[A-Za-z0-9_\-]+$/;  //Some reserved words
    var nameReserved =['about','access','account','accounts','add','address','adm','admin','administration', 
                     'adult','advertising','affiliate','affiliates','ajax','analytics','android','anon','anonymous',
                     'api','app','apps','archive','atom','auth','authentication','avatar','backupbanner','banners','bin',
                     'billing','blog','blogs','board','bot','bots','business','chat','cache','cadastro','calendar',
                     'campaign','careers','cgi','client','cliente','code','comercial','compare','config','connect',
                     'contact','contest','create','code','compras','css','dashboard','data','db','design','delete',
                     'demo','design','designer','dev','devel','dir','directory','doc','docs','domain','download',
                     'downloads','edit','editor','email','ecommerce','forum','forums','faq','favorite','feed','feedback',
                     'flog','follow','file','files','free','ftpg','adget','gadgets','games','guest','group','groups',
                     'help','home','homepage','host','hosting','hostname','html','http','httpd','https','hpg','info',
                     'information','image','img','images','imap','index','invite','intranet','indice','ipad','iphone',
                     'irc','java','javascript','job','jobs','js','knowledgebase','log','login','logs','logout','list',
                     'lists','mail','mail1','mail2','mail3','mail4','mail5','mailer','mailing','mx','manager','marketing',
                     'master','me','media','message','microblog','microblogs','mine','mp3','msg','msn','mysql','messenger',
                     'mob','mobile','movie','movies','music','musicas','my','name','named','net','network','new','news',
                     'newsletter','nick','nickname','notes','noticias','ns','ns1','ns2','ns3','ns4','old','online',
                     'operator','order','orders','page','pager','pages','panel','password','perl','pic','pics','photo',
                     'photos','photoalbum','php','plugin','plugins','pop','pop3','post','postmaster','postfix','posts',
                     'profile','project','projects','promo','pub','public','python','random','register','registration',
                     'root','ruby','rss','sale','sales','sample','samples','script','scripts','secure','send','service',
                     'shop','sql','signup','signin','search','security','settings','setting','setup','site','sites',
                     'sitemap','smtp','soporte','ssh','stage','staging','start','subscribe','subdomain','suporte',
                     'support','stat','static','stats','status','store','stores','system','tablet','tablets','tech',
                     'telnet','test','test1','test2','test3','teste','tests','theme','themes','tmp','todo','task','tasks',
                     'tools','tv','talk','update','upload','url','user','username','usuario','usage','vendas','video',
                     'videos','visitor','win','ww','www','www1','www2','www3','www4','www5','www6','www7','wwww','wws',
                     'wwws','web','webmail','website','websites','webmaster','workshop','xxx','xpg','you','yourname',
                     'yourusername','yoursite','yourdomain'];
    
    /*
        Fullscreen background
    */
    var getTime=function(){
        var date = new Date();
        return date.toLocaleTimeString();
    }

    //$.backstretch("img/intro-bg.jpg");
    
    /*
        Form validation
    */
    $usernameInput.click(function () {
        $usernameInput.focus();
    });
    // Focus input when clicking anywhere on login page
    $userPassword.click(function () {
        $userPassword.focus();
    });


    $login.click(function(event) {
        event.preventDefault();
        username=$('#form-username').val().trim();
        password=$('#form-password').val();
        //alert("Value: " + password);
        //validity of username
        nameFirstChar = username.substr(0,1);
        nameLastChar = username.substr(username.length-1,1);
        position = nameReserved.indexOf(username);
        

        if(!username||username.length<3) alert("userName cannot be less than 3 characters");
        else if(!username.match(nameRegx)||nameFirstChar=='-'||nameLastChar=='-') alert("invalide userName ! ");
        else if(position>=0) alert("Oops! Your name is reserved, change another one!");
        else if(!password||password.length<4) alert("passWord cannot be less than 4 characters");   
        else{
            $.post("/user/login",{
                username: username,
                password: password
            },
            function(response){
                if(response.statusCode === 200){
                    username=response.username;
                    window.location.href = "./chat_public.html?username=" + username; 
                }
                if(response.statusCode === 401){
                    //wrong password
                    alert("wrong username with password");
                    
                }
                if(response.statusCode === 404){
                    //user not found                   
                    alert("user not found");
                    
                }
            });
        }
        clearInput();
        
    });
    
    function clearInput(){
        $('#form-username').val('');
        $('#form-password').val('');
    }


    
    
});
