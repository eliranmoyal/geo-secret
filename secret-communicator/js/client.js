/**
 * Created by Hila on 26/12/2015.
 */

function SocketChatClient() {
    this.client_socket = undefined;
}


SocketChatClient.prototype.init = function() {
    this.client_socket = io();
}

SocketChatClient.prototype.isInitialized = function () {
    return this.client_socket != undefined;
}

SocketChatClient.prototype.startChat =  function(ring,onNewMessage,onNewUser,onAllUsers){
    this.client_socket.emit("CHAT", {ring: ring});

    // connect to receive_messages and call onNewMessage
    this.client_socket.on("RECEIVE_MSG", function(msg){
        onNewMessage(JSON.parse(msg));
    });

    // connect to new_user and call onNewUser
    this.client_socket.on("NEW_USER", function(msg){
        onNewUser(JSON.parse(msg));
    });

    this.client_socket.on("GET_USERS", function(users){
        onAllUsers(users);
    });
};

/***
 * Asks from the server the public key list of the current group on secret.
 */
SocketChatClient.prototype.getPublicKeysFromServer = function(){

    this.client_socket.emit("PUBLIC_KEYS");

    this.client_socket.on("PUBLIC_KEYS", function(public_keys){
        return public_keys;
    });
}

/***
 * Asks from the server the friends list of the ring group on secret.
 *
 * returns array of json object(users) of the form: [{social_id:"",social_type:""},...]
 */
SocketChatClient.prototype.getUsersFromServer = function(){

    this.client_socket.emit("GET_USERS");
}

/***
 *  Send a message to the group
 * @param msg   the message
 * @param sign  the user sign
 */
SocketChatClient.prototype.sendMessage = function(msg, sign){

    var msg_obj = {
        msg: msg,
        sign: sign
    }
    this.client_socket.emit("SEND_MSG",JSON.stringify(msg_obj));
};