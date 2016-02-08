
var facebookId;
var chatClient = new SocketChatClient();
var facebookToken;
var cryptoApi = new CryptoApi();
var currentKeys;

function afterFacebookLogin(id,tokenId){
	
	console.log("on controller afterFacebookLogin");
	console.log ("id:" + id);
	facebookId  = id;
	facebookToken = tokenId;
	console.log("tokenId:" + tokenId);
    replaceDivs("#ring-container",'#login-container');
    setTimeout(function() {
      findChats();
    }, 200);
    
}

function replaceDivs(divToAppear,divToRemove){
    $(divToRemove).addClass("animated").addClass("fadeOutUpBig");
    setTimeout(function() {
      $(divToRemove).remove();
      $(divToAppear).removeClass("hidden").addClass("animated").addClass("fadeInDownBig");
    }, 200);

}

function findChats () {

    //todo: for each chat get connected user count
    $.get( "/chats")
          .done(function( result ) {
            var rings = result.rings;
            for (var i = rings.length - 1; i >= 0; i--) {
                ring = rings[i];
                 var li = $('<li>');
                 var a = $('<a>');
                 a.addClass("chat_name");
                 a.attr("onClick","joinRing('" + ring +"')");
                 a.append(ring);
                 li.append(a);
                $('#chats_list').append(li);
            };
          });
}

function joinRing(ringName) {
    console.log("clicked on ring: " + ringName);
    replaceDivs("#chat-container","#ring-container");
    if(!chatClient.isInitialized()){
        chatClient.init();
    }
    chatClient.startChat(ringName,onNewMessage,onNewUser);

    var users = chatClient.getUsersFromServer();
    console.log("users:");
    console.log(users);
    //todo: find ids of group - add them to list
    //init encryption stuff
}

function onNewMessage(data) {

}

function onNewUser (argument) {
    // body...
}

function generatePublicKeyAndEncryptedPrivateKey () {
    this.currentKeys = cryptoApi.generateKeys();
    //todo: call crypto api to encrypt key + add password in this stage.   
    encrypedKey = cryptoApi.encryptKey("somePassword",this.currentKeys["privateKey"]);
    return {
        "publicKey": currentKeys["publicKey"],
        "encrypedPrivateKey" : encrypedKey
    };
}

$(document).ready(function(){
     $('#registerForm').submit(function (e) {
         e.preventDefault();
         console.log("register...");
         data = {};
         data["token"] = facebookToken;
         data["social_id"] = facebookId;
         data["social_type"] = "facebook";
         key = generatePublicKeyAndEncryptedPrivateKey();
         data["public_key"] = key["publicKey"];
         data["encrypted_private_key"] = key["encrypedPrivateKey"];
         requestedRing =$("#ring").val(); 
         data["ring"] = requestedRing;
         console.log(data);
         
        $.post( "/register", data)
		  .done(function( result ) {
		    console.log("register result:");
            console.log(result);
            if(result.success == true){
               joinRing(requestedRing.toLowerCase()); 
            }
            else {
                alert("could not register to ring " + JSON.stringify(result));
            }

		  });
     });
});