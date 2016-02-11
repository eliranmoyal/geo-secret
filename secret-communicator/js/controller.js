
/*
    the controller class
    it controls the ui states (facebooklogin,registration,chat)
    and has functions to transafer between tham
    it contains all data for current chat (currentRing ,currentKey,otherTrapDoors,myTrapDoor )
    it calls the crypto_api for encrypting/decrypting private key using password
    it calls the crypto_api for ring signatuare and validation of ring signature
*/
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
var ringName;
var myPassword ="somePassword";
var afterPasswordGivenHandler;
var myRings = [];


/*
    called after successful facebook login
    moving to register phase
    and calling server to get all aviliable and registered chats
*/
function afterFacebookLogin(id,tokenId){
	
	console.log("on controller afterFacebookLogin");
	console.log ("id:" + id);
	facebookId  = id;
	facebookToken = tokenId;
	console.log("tokenId:" + tokenId);

    data = {}
    data["social_id"] = facebookId;
    data["social_type"] = "facebook";

    $.post('/my_rings', data)
    .done(function( result ) {
        console.log("my rings:");
        console.log(result["rings"]);
        setMyRings(result["rings"]);
    });
    replaceDivs("#ring-container",'#login-container');
    setTimeout(function() {
      findChats();
    }, 200);
    
}

/*
utility function to move between phases in style..
*/
function replaceDivs(divToAppear,divToRemove){
    $(divToRemove).addClass("animated").addClass("fadeOutUpBig");
    setTimeout(function() {
      $(divToRemove).remove();
      $(divToAppear).removeClass("hidden").addClass("animated").addClass("fadeInDownBig");
    }, 200);

}

/* used for find chats  to check which chat are you registered to*/
function checkIfRegisteredRing (ring) {
    return myRings.indexOf(ring) != -1;
}
/* used for find chats  to check which chat are you registered to*/
function setMyRings (rings) {
    this.myRings = rings;
}

/* find all chats to fill list on register phase */
function findChats () {
    //todo: for each chat get connected user count
    $.get( "/chats")
          .done(function( result ) {
            var rings = result.rings;
            for (var i = rings.length - 1; i >= 0; i--) {
                ring = rings[i];
                 var li = $('<li>');
                 var a = $('<a>');
                 //for ui to see if it is already registered
                 if(checkIfRegisteredRing(ring)){
                    a.addClass("registered_ring");
                 }
                 else {
                   a.addClass("not_registered_ring");  
                 }
                 a.addClass("chat_name");
                 a.attr("onClick","joinRing('" + ring +"',false)");
                 a.append(ring);
                 li.append(a);
                $('#chats_list').append(li);
            };
          });
}

/*update chat credentials after registeration / joining a ring */
function updateChatCredentials (result,moveToChat) {
  decryptResult = cryptoApi.decryptKey(this.myPassword,result.encrypted_private_key);
    if (undefined == decryptResult){
        alert("This is not your password!!");

        return;
    }
  myTrapDoorKey =  trapDoorFromJson(decryptResult);
  myIndex = result["index_on_ring"] == undefined?1:result["index_on_ring"]
    if(moveToChat){
        replaceDivs("#chat-container","#ring-container");
    }
}

/* calling server to get my credantials */
function updateIndexAndMyKey (ringName,moveToChat) {
    data = {}
     data["token"] = facebookToken;
     data["social_id"] = facebookId;
     data["social_type"] = "facebook";
     data["ring"] = ringName.toLowerCase();
    $.post( "/chat_credentials", data)
          .done(function( result ) {
          updateChatCredentials(result,moveToChat);
      });
    
}

/* joins the ring , starting server calls (get all users and keys , initalize sockets) */
function joinRingAfterPasswordGiven () {
     
    if(currentRing != this.ringName.toLowerCase()){
        //joining another ring , and not registered ring.
        currentRing = this.ringName.toLowerCase();
        myIndex = undefined;
        myTrapDoorKey = undefined;
        this.otherTrapDoors = undefined;
    }

    updateIndexAndMyKey(ringName,true);

    $("#chatTitle").html("Secrets - " + this.ringName);
    //todo: call getUserInfo.....
    myIndex = 0;
    if(!chatClient.isInitialized()){
        chatClient.init();
    }
    chatClient.startChat(this.ringName,onNewMessage,onNewUser,onUsersOfChat,onPublicKeys);
    //async call that will trigger onUsersOfChat
    chatClient.getUsersFromServer();
    //async call that will trigger onPublicKeys
    chatClient.getPublicKeysFromServer();
    

}
/*
join the ring first we need to know if password was given already (after registration)
or no password given - its a re-connect from new session
*/
function joinRing(ringName,passwordEnterdAlready) {
    this.ringName = ringName;
    if(passwordEnterdAlready){
        joinRingAfterPasswordGiven();
    }
    else {
       /* toggels password modal */
        $('#passwordModal').modal('toggle');
        $('#passwordModal').modal('show');
        this.afterPasswordGivenHandler = joinRingAfterPasswordGiven;
        /* now waiting for him to put password and than joinRingAfterPasswordGiven will be called*/
    }
   
}


/*
called when server returns users from db
*/
function onUsersOfChat (users) {
    var allUsers = users.users_info;

    for(i=0;i<allUsers.length;i++){
        user = allUsers[i];
        if(user.social_type == "facebook"){
            addFacebookUserToConnectedList(user.social_id);
        }
    }
}

/*
    called when server return keys for chat from db
*/
function onPublicKeys (publicKeysObj) {
    publicKeys = publicKeysObj["public_keys"];
    trapDoors = [];
    for(i=0;i<publicKeys.length;i++){
        trapDoor = trapDoorFromJson(JSON.parse(publicKeys[i]));
        //we dont need our public key
        if(i != this.myIndex){
            trapDoors.push(trapDoor);
        }
    }
    this.otherTrapDoors = trapDoors;
}

/*
    happen when i enter my message
*/
function onMyMessage() {
    var text = chatUi.getMessageText();
    chatUi.displayMessage(text,true,undefined);
    
    if(myTrapDoorKey == undefined || myIndex == undefined){
        updateIndexAndMyKey(currentRing,false);
        //todo: in some use cases we need to wait for it
        // maybe need to transfer signAndEmit for updateIndexAndMyKey
    }
    signAndEmit(text);
}

/*
calc signature with cryptoApi and emit it to server
*/
function signAndEmit(text){
    //get all  public keys.
    var signature = cryptoApi.signMessage(text,myTrapDoorKey,this.otherTrapDoors,myIndex);
    //encrypt and emit
    var msg = {
        msg: text,
        sign: signature
    }

    chatClient.sendMessage(msg);
    //todo: clearMessageText
}

/*
    new message from server validate the server and display the message
*/
function onNewMessage(data) {
    // validate msg with data.sign
    var validationStatus = cryptoApi.validateMessage(data.sign);
    chatUi.displayMessage(data.msg,false,validationStatus);
}

/*
    new user has joined the chat
*/
function onNewUser (user) {
    //call facebook api. get his image and name to display on members
    if(user.social_type == "facebook"){
        addFacebookUserToConnectedList(user.social_id)
    }

    //add it to the list of trap doors
    otherTrapDoors.push(trapDoorFromJson(JSON.parse(user.public_key)));
}

/*
    generate keys for registration
*/
function generatePublicKeyAndEncryptedPrivateKey () {
    this.currentKeys = cryptoApi.generateKeys();
    encrypedKey = cryptoApi.encryptKey(this.myPassword,this.currentKeys["privateKey"]);
    myTrapDoorKey = trapDoorFromJson(this.currentKeys["privateKey"]);
    return {
        "publicKey": JSON.stringify(currentKeys["publicKey"]),
        "encrypedPrivateKey" : JSON.stringify(encrypedKey)
    };
}

/*
    when people click OK on password modal
*/
function passwordEntered () {
    this.myPassword = $("#pwd").val();
    myPassword = this.myPassword;
    $('#passwordModal').modal('hide');
    this.afterPasswordGivenHandler();
}

/*
create a post request to register a ring
*/
function registerToRing () {
    var data = {};
         data["token"] = facebookToken;
         data["social_id"] = facebookId;
         data["social_type"] = "facebook";
         // todo: get a password from the user and encrypt the private key with it.
         var key = generatePublicKeyAndEncryptedPrivateKey();
         data["public_key"] = key["publicKey"];
         data["encrypted_private_key"] = key["encrypedPrivateKey"];
         var requestedRing =$("#ring").val();
         data["ring"] = requestedRing;
         currentRing = requestedRing.toLowerCase();
         
        $.post( "/register", data)
          .done(function( result ) {
            if(result.success == true){
               joinRing(requestedRing.toLowerCase(),true); 
            }
            else {
                alert("could not register to ring " + JSON.stringify(result));
            }

          });
}

function setAfterPasswordHandler (handler) {
    this.afterPasswordGivenHandler = handler;
}

/*some events registrations*/
$(document).ready(function(){

    //register form - start password modal and eventualy create a post
     $('#registerForm').submit(function (e) {
         e.preventDefault();
         console.log("register...");
         $('#passwordModal').modal('toggle');
        $('#passwordModal').modal('show');
         setAfterPasswordHandler(registerToRing);
         
     });

     //register to events to send messages on chat
     $('.send_message').click(function (e) {
            return onMyMessage();
        });
        $('.message_input').keyup(function (e) {
            if (e.which === 13) {
               onMyMessage();
            }
        });

});