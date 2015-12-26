/**
 * Created by Hila on 26/12/2015.
 */

module.exports =  function(socket) {

    this.client_socket = socket;

    /*
    First connection to the server, transform to the server the facebook_id and public_key of the user.
     */
    function connectServer(facebook_id, public_key){

        var msg = {
            facebook_id: facebook_id,
            public_key: public_key
        }

        this.client_socket.emit("CONNECT", msg.toJSON());
    };

    /*
    Asks from the server the public key list of the current group on secret.
     */
    function getPublicKeysFromServer(facebook_id){

        this.client_socket.emit("PUBLIC_KEYS", facebook_id);

        this.client_socket.on("PUBLIC_KEYS", function(public_keys_array){
            return public_keys_array;
        });
    }

    /*
    Send a message to the group
     */
    function sendMessage(public_keys, msg, sign){

        msg_obj = {
            public_keys: public_keys,
            msg: msg,
            sign: sign
        }
        this.client_socket.emit("SEND_MSG", msg_obj.toJSON());
    };

    /*
    Receive a message from the group
    @returns JSON object: {public_keys, msg, sign}
     */
    function receiveMessage(){

        this.client_socket.on("RECEIVE_MSG", function(msg){
           return JSON.parse(msg);
        });

    };

    return {
        connectServer:connectServer,
        getPublicKeysFromServer:getPublicKeysFromServer,
        sendMessage:sendMessage,
        receiveMessage:receiveMessage
    };
}