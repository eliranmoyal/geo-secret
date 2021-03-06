/**
 * Created by Hila on 26/12/2015.
 */

function SocketChatClient() {
    this.client_socket = undefined;
}

/**
 * Initialize the client socket
 */
SocketChatClient.prototype.init = function() {
    this.client_socket = io();
}

SocketChatClient.prototype.isInitialized = function () {
    return this.client_socket != undefined;
}

/***
 * Starts a chat by sending "CHAT" msg to the server, and start listening on some messages.
 * @param ring  - the ring of the chat
 * @param onNewMessage - UI function to call when a new msg is received.
 * @param onNewUser    - UI function to call when a new user joins.
 * @param onAllUsers   - UI function to call when a msg with the users details is received.
 * @param onPublicKeys - UI function to call when a msg with the users public keys is received.
 */
SocketChatClient.prototype.startChat =  function(ring,onNewMessage,onNewUser,onAllUsers,onPublicKeys){
    this.client_socket.emit("CHAT", {ring: ring});

    // connect to receive_messages and call onNewMessage
    this.client_socket.on("RECEIVE_MSG", function(msg){
        onNewMessage(msg);
    });

    // connect to new_user and call onNewUser
    this.client_socket.on("NEW_USER", function(msg){
        onNewUser(msg);
    });

    this.client_socket.on("GET_USERS", function(users){
        onAllUsers(users);
    });

    this.client_socket.on("PUBLIC_KEYS", function(public_keys){
         onPublicKeys(public_keys);
    });
};

/***
 * Asks from the server the public key list of the current group on secret.
 */
SocketChatClient.prototype.getPublicKeysFromServer = function(){

    this.client_socket.emit("PUBLIC_KEYS");
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
 * @param msg   {msg: <msg>, sign: <sign>}
 */
SocketChatClient.prototype.sendMessage = function(msg){
    this.client_socket.emit("SEND_MSG",msg);
};