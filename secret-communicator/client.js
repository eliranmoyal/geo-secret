/**
 * Created by Hila on 26/12/2015.
 */

module.exports =  function() {

    this.io = require('socket.io')();
    this.client_socket = '';

    function startChat(ring,onNewMessage,onNewUser)
    {
        this.client_socket = this.io.connect('/chat',{query:"ring=('#ring'))"});

        // connect to receive_messages and call onNewMessage
        this.client_socket.on("RECEIVE_MSG", function(msg){
            onNewMessage(JSON.parse(msg));
        });

        // connect to new_user and call onNewUser
        this.client_socket.on("NEW_USER", function(msg){
            onNewUser(JSON.parse(msg));
        });
    };

    /***
     * Asks from the server the public key list of the current group on secret.
     */
    function getPublicKeysFromServer(){

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
    function getUsersFromServer(){

        this.client_socket.emit("GET_USERS");

        this.client_socket.on("GET_USERS", function(users){
            return users;
        });
    }

    /***
     *  Send a message to the group
     * @param msg   the message
     * @param sign  the user sign
     */
    function sendMessage(msg, sign){

        var msg_obj = {
            msg: msg,
            sign: sign
        }
        this.client_socket.emit("SEND_MSG", msg_obj.toJSON());
    };

    /***
     *  Exports the functions for the client use - connecting the server, receiving public keys of the group, send and receive a message.
     */
    return {
        startChat:startChat,
        getPublicKeysFromServer:getPublicKeysFromServer,
        getUsersFromServer:getUsersFromServer,
        sendMessage:sendMessage
    };
}