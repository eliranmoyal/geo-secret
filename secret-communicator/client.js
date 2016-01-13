/**
 * Created by Hila on 26/12/2015.
 */

module.exports =  function() {

    this.io = require('socket.io')();
    this.client_socket = '';

    /***
     * First connection to the server for joining a ring, sends to the server the relevant user details.
     * @param social_id     the social id of the user
     * @param social_type   the social type (facebook/twitter/google+)
     * @param public_key    the public key of the user
     * @param ring          the ring the user wants to join
     * @param token         the token of the user
     */
    function joinRing(social_id, social_type, public_key, ring, token){

        var query = {query:"social_id=$('#social_id')&" +
        "social_type=$('#social_type')&" +
        "public_key=$('#public_key')&" +
        "ring=$('#ring')&" +
        "token=$('#token')"};

        this.io.connect('/joinRing', query);
    };

    function startChat(ring,onNewMessage,onNewUser)
    {
        this.client_socket = this.io.connect('/chat',{query:"ring=$('#ring'))"});
        //todo: connect to recieve_messages and call onNewMessage
        //todo: connect to new_user and call onNewUser
    };

    /***
     * Asks from the server the public key list of the current group on secret.
     */
    function getPublicKeysFromServer(){

        this.client_socket.emit("PUBLIC_KEYS");

        this.client_socket.on("PUBLIC_KEYS", function(public_keys_array){
            return public_keys_array;
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
     * Receive a message from the group
     * @returns object {type,msg} (type might be RECEIVE_MSG or NEW_USER)
     */
    function receiveMessage(){

        this.client_socket.on("RECEIVE_MSG", function(msg){
           return {type:"RECEIVE_MSG", msg:JSON.parse(msg)};
        });

        this.client_socket.on("NEW_USER", function(msg){
            return {type:"NEW_USER", msg:JSON.parse(msg)};
        });
    };

    /***
     *  Exports the functions for the client use - connecting the server, receiving public keys of the group, send and receive a message.
     */
    return {
        joinRing:joinRing,
        startChat:startChat,
        getPublicKeysFromServer:getPublicKeysFromServer,
        getUsersFromServer:getUsersFromServer,
        sendMessage:sendMessage,
        receiveMessage:receiveMessage
    };
}