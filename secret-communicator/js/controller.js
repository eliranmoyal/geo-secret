
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
        // todo: mark the rings that I am already registered too.
    });
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
                 a.attr("onClick","joinRing('" + ring +"',false)");
                 a.append(ring);
                 li.append(a);
                $('#chats_list').append(li);
            };
          });
}

function updateChatCredentials (result) {
  console.log("chat credentials result:");
  console.log(result);
  console.log("CONTROLLER - decryptKey:"+result.encrypted_private_key);
  console.log("CONTROLLER - decryptKey password:" +this.myPassword);
  decryptResult = cryptoApi.decryptKey(this.myPassword,result.encrypted_private_key);
  console.log("CONTROLLER - decryptKey RESULT:");
  console.log(decryptResult);
  myTrapDoorKey =  trapDoorFromJson(decryptResult);
  console.log("myTrapDoorKey");
  console.log(myTrapDoorKey);
  myIndex = result["index_on_ring"] == undefined?1:result["index_on_ring"]
}

function updateIndexAndMyKey (ringName) {
    console.log("ring: " + ringName);
    data = {}
     data["token"] = facebookToken;
     data["social_id"] = facebookId;
     data["social_type"] = "facebook";
     data["ring"] = ringName.toLowerCase();
    $.post( "/chat_credentials", data)
          .done(function( result ) {
          updateChatCredentials(result);
      });
    
}

function joinRingAfterPasswordGiven () {
     
    if(currentRing != this.ringName.toLowerCase()){
        //joining another ring , and not registered ring.
        currentRing = this.ringName.toLowerCase();
        myIndex = undefined;
        myTrapDoorKey = undefined;
        this.otherTrapDoors = undefined;
    }
    updateIndexAndMyKey(ringName);
    console.log("clicked on ring: " + this.ringName);
    replaceDivs("#chat-container","#ring-container");
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
    
    //todo: find ids of group - add them to list
    //init encryption stuff

}
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


function onPublicKeys (publicKeysObj) {
    publicKeys = publicKeysObj["public_keys"];
    trapDoors = [];
    for(i=0;i<publicKeys.length;i++){
        trapDoor = trapDoorFromJson(JSON.parse(publicKeys[i]));
        console.log(trapDoor);
        console.log("i:"+ i + " myIndex:"+myIndex);
        if(i != this.myIndex){
            trapDoors.push(trapDoor);
        }
    }
    console.log("othertrapdoors:") 

    this.otherTrapDoors = trapDoors;
    console.log(this.otherTrapDoors) ;
}


function onMyMessage() {
    var text = chatUi.getMessageText();
    chatUi.displayMessage(text,true,undefined);
    
    if(myTrapDoorKey == undefined || myIndex == undefined){
        updateIndexAndMyKey(currentRing);
        //todo: maby need to wait??
        //set timeout and than call signAndEmit
        console.log("start timeout");
        //setTimeout(signAndEmit, 20000,text);
    }
    signAndEmit(text);
}

function signAndEmit(text){
    //get all  public keys.
    console.log("text: " + text);
    console.log("trapdoorekey: " + JSON.stringify(myTrapDoorKey));
    console.log("othertrapdoor: " + JSON.stringify(this.otherTrapDoors));
    console.log("index: " + myIndex);
    var signature = cryptoApi.signMessage(text,myTrapDoorKey,this.otherTrapDoors,myIndex);

    console.log("signature :");
    console.log(signature)
    //encrypt and emit
    var msg = {
        msg: text,
        sign: signature
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
    // validate msg with data.sign
    console.log(JSON.stringify(data.sign));
    var validationStatus = cryptoApi.validateMessage(data.sign);

    console.log("Validation response:")
    console.log(validationStatus);
    //var validationStatus = true;
    chatUi.displayMessage(data.msg,false,validationStatus);
}

function onNewUser (user) {
    console.log("CONTROLLER -- on new user");
    console.log(user);
    //todo: call facebook api. get his image and call it
    if(user.social_type == "facebook"){
        addFacebookUserToConnectedList(user.social_id)
    }

    //add it to the list with the correct index.
    otherTrapDoors.push(trapDoorFromJson(JSON.parse(user.public_key)));
}




function generatePublicKeyAndEncryptedPrivateKey () {
    this.currentKeys = cryptoApi.generateKeys();
    console.log("CONTROLLER - encryptKey:")
    console.log(this.currentKeys["privateKey"]);
    encrypedKey = cryptoApi.encryptKey(this.myPassword,this.currentKeys["privateKey"]);
    console.log("CONTROLLER = encrypedKeyRESULT:");
    console.log(encrypedKey);
    myTrapDoorKey = trapDoorFromJson(this.currentKeys["privateKey"]);
    return {
        "publicKey": JSON.stringify(currentKeys["publicKey"]),
        "encrypedPrivateKey" : JSON.stringify(encrypedKey)
    };
}

function passwordEntered () {
    this.myPassword = $("#pwd").val();
    console.log("password changed to:" + this.myPassword);
    myPassword = this.myPassword;
    $('#passwordModal').modal('hide');
    this.afterPasswordGivenHandler();
}

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
         console.log(data);
         
        $.post( "/register", data)
          .done(function( result ) {
                console.log("/register");
            console.log("register result:");
            console.log(result);
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
$(document).ready(function(){

    //register form registration
     $('#registerForm').submit(function (e) {
         e.preventDefault();
         console.log("register...");
         $('#passwordModal').modal('toggle');
        $('#passwordModal').modal('show');
         setAfterPasswordHandler(registerToRing);
         
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