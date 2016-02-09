
var facebookId;
var chatClient = new SocketChatClient();
var facebookToken;
var cryptoApi = new CryptoApi();
var chatUi = new ChatUi();
var currentKeys;
var myIndex;
var myTrapDoorKey;
var otherTrapDoors;
var currentRing;

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

function updateIndexAndMyKey (ringName) {
    data = {}
     data["token"] = facebookToken;
     data["social_id"] = facebookId;
     data["social_type"] = "facebook";
     data["ring"] = ringName.toLowerCase();
    $.post( "/chat_credentials", data)
          .done(function( result ) {
            console.log("register result:");
            console.log(result);
            myTrapDoorKey =  trapDoorFromJson(cryptoApi.decryptKey("somePassword",result.encrypted_private_key));
            myIndex = result["index_on_ring"] == undefined?1:result["index_on_ring"]

      });
    
}

function joinRing(ringName) {
    if(currentRing != ringName.toLowerCase()){
        //joining another ring , and not registered ring.
        currentRing = ringName.toLowerCase();
        myIndex = undefined;
        myTrapDoorKey = undefined;
        otherTrapDoors = undefined;
    }
    updateIndexAndMyKey(ringName);
    console.log("clicked on ring: " + ringName);
    replaceDivs("#chat-container","#ring-container");
    $("#chatTitle").html("Secrets - " + ringName);
    //todo: call getUserInfo.....
    myIndex = 0;
    if(!chatClient.isInitialized()){
        chatClient.init();
    }
    chatClient.startChat(ringName,onNewMessage,onNewUser,onUsersOfChat,onPublicKeys);
    //async call that will trigger onUsersOfChat
    chatClient.getUsersFromServer();
    //async call that will trigger onPublicKeys
    chatClient.getPublicKeysFromServer();
    
    //todo: find ids of group - add them to list
    //init encryption stuff
}



function onUsersOfChat (users) {
    console.log("users:");
    console.log(users);
    var allUsers = users.users_info;

    for(i=0;i<allUsers.length;i++){
        user = allUsers[i];
        if(user.social_type == "facebook"){
            addFacebookUserToConnectedList(user.social_id);
        }

        
    }
}


function onPublicKeys (publicKeys) {
    trapDoors = []
    for(i=0;i<publicKeys.length;i++){
        trapDoor = trapDoorFromJson(JSON.parse(publicKeys[i]));
        if(i != myIndex)
            trapDoors.push(trapDoor);
    }
    otherTrapDoors = trapDoors;

}

function getPrivateKeyAndMyIndexFromServer () {
    //todo: implement this when hila generate index.
}


function onMyMessage() {
    var text = chatUi.getMessageText();
    chatUi.displayMessage(text,true,undefined);
    
    if(myTrapDoorKey == undefined || myIndex == undefined){
        getPrivateKeyAndMyIndexFromServer();
    }
    //get all  public keys.
    
    //encrypt and emit
    msg = {
        "msg": text,
        "sign": "magnificantSignitature"//signMessage(text,myTrapDoorKey,otherKeys,myIndex)
    }
    chatClient.sendMessage(msg);
    //todo: clearMessageText
    

}

/*
+    try to validate and return the validation status
 +    maby call server /know  all people . check users/usersIKnow 
 +    and add it to the validationStatus??
 +    displayMessage(text,false,validationStatus)
*/
function onNewMessage(data) {
    console.log("onNewMessage");
    console.log(data);
    //todo: cryptoApiToCheck valdation with data.msg.sign
    validationStatus = true;
    chatUi.displayMessage(data.msg.msg,false,validationStatus);
}

function onNewUser (user) {
    //todo: call facebook api. get his image and call it
    if(user.social_type == "facebook"){
       addFacebookToConnectedList(user.social_id)
    }

    //add it to the list with the correct index.
    otherTrapDoors.push(trapDoorFromJson(JSON.parse(user.public_key)));
}




function generatePublicKeyAndEncryptedPrivateKey () {
    this.currentKeys = cryptoApi.generateKeys();
    this.myTrapDoorKey = trapDoorFromJson(this.currentKeys["privateKey"]);
    //todo: call crypto api to encrypt key + add password in this stage.   
    encrypedKey = cryptoApi.encryptKey("somePassword",this.currentKeys["privateKey"]);
    return {
        "publicKey": JSON.stringify(currentKeys["publicKey"]),
        "encrypedPrivateKey" : JSON.stringify(encrypedKey)
    };
}

$(document).ready(function(){

    //register form registration
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
         currentRing = requestedRing.toLowerCase();
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

     //register chat messages calls
     $('.send_message').click(function (e) {
            return onMyMessage();
        });
        $('.message_input').keyup(function (e) {
            if (e.which === 13) {
               onMyMessage();
            }
        });

});