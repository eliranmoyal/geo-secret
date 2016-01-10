/**
 * Created by Hila on 26/12/2015.
 */

/*
 Geo-Secret-Web-App-Server.
 */

module.exports =  function(){

    /********** Initialization **********/

    var express = require('express');
    var app = express();
    var http = require('http').Server(app);
    var io = require('socket.io')(http);
    var myDB = require('./server_db.js');

    myDB.init();

    app.set('port', (process.env.PORT || 3000));
    app.use("/css",express.static(__dirname +"/css"));
    app.use("/js",express.static(__dirname +"/js"));
    app.use("/img",express.static(__dirname +"/img"));
    app.use("/fonts",express.static(__dirname +"/fonts"));

    app.get('/', function(req, res){
        res.sendFile(__dirname + '/index.html');
    });


    app.get('/privacy', function(req, res){
        res.sendFile(__dirname + '/privacy_policy.html');
    });

    // todo: decide whether we want those pages or not.

    /*
    FOR THIS WE DO WANT . not with get.. just a post to join ring.
    app.get('/joinRing', function(req,res){
        res.sendFile(__dirname + '/join_ring.html');
    });

    app.get('/chat', function(req,res){
        res.sendFile(__dirname + '/chat.html');
    });*/

    var users = [];
    var sockets_by_ring = [];

    /*******************************Help Methods********************************/

    /***
     */
    function validateUserToken(social_id,social_type,token){
        // todo: implement
        return true;
    }

    /***
     * Finds the public keys of a group by ring and returns them.
     * @param ring
     * @returns {Array} - the public keys
     */
    function getPublicKeysOfRing(ring){

        // todo: read from db instead
        //myDB.getPublicKeysByRing(ring);
        var public_keys = [];

        for (var user in users[ring.toLowerCase()]){
            public_keys.push(user.public_key);
        }

        return public_keys;
    }

    /***
     * Finds the users social info of a group by ring and returns them.
     * @param ring
     * @returns {Array}
     */
    function getUsersSocialInfoByRing(ring){

        var ring_users_info = [];

        // todo: read from db instead
        //myDB.getUsersSocialInfoByRing(ring);

        for (var user in users[ring.toLowerCase()]){
            var user_info = {
                social_id: user.social_id,
                social_type: user.social_type
            }

            ring_users_info.push(user_info);
        }

        return ring_users_info;
    }

    /***
     * Adds an active socket of a user to sockets_by_ring
     * @param ring
     * @param user_socket
     */
    function addUserSocketByRing(ring, user_socket){

        sockets_by_ring[ring.toLowerCase()].push(user_socket);
    }

    /******************************Main running method********************************/

    /***
     *  Server starts running - listening
     *  and handle new connections.
     */
    function run(){
        http.listen(app.get('port'), function(){
            console.log('listening on *:3000');
        });
        newConnection();
    };

    /******************************Communication Methods********************************/

    /***
     *  Handling a new connection.
     *  Handles the connection, the user messages and disconnection.
     */
    function newConnection(){

        // handle connection of /joinRing
        io.of('/joinRing').on('connection', function(socket){

            joinRing(socket.handshake.query);
        });

        // handle connection of /chat
        io.of('/chat').on('connection', function(socket){

            // Add the user socket to the users list by the token
            addUserSocketByRing(socket.handshake.query.ring, socket);
            handleUserMessage(socket, socket.handshake.query.ring);
        })
    };

    /***
     * Handle a first join to a ring
     * @param user_params - the params from the url query {social_id,social_type,public_key,ring,token}.
     */
    function joinRing(user_params){
        console.log('a user joined a ring');

        var user = {
            social_id: user_params.social_id,
            social_type: user_params.social_type,
            public_key: user_params.public_key,
            ring: user_params.ring
        };


        if(users.indexOf(user.ring) == -1){ //First initialization of a ring
            users[user.ring] = [];
        }

        if (!validateUserToken(user_params.token)){
            return;
        }

        // todo: write to db instead
        //myDB.addNewUser(user.social_id, user.social_type, user.public_key, user.ring);
        users[user.ring].push(user);

        // Publish to every ring member the new user details

        var user_to_publish = {
            social_id: user.social_id,
            social_type: user.social_type,
            public_key: user.public_key
        }

        broadcastRingMessage("NEW_USER",user_to_publish, user.ring, socket);

    };

    /***
     * Handles user's messages- SEND_MSG (broadcast message to the ring group)
     * PUBLIC_KEYS (return to the user the public keys of it's group).
     * GET_USERS (return to the user the ring's users info).
     * @param socket
     * @param ring
     */
    function handleUserMessage(socket, ring){

        socket.on("SEND_MSG", function(msg){
            console.log('message: ' + msg);
            broadcastRingMessage("RECEIVE_MSG", msg, ring, socket);
        });

        socket.on("PUBLIC_KEYS", function(){
            var public_keys = getPublicKeysOfRing(ring);
            socket.emit("PUBLIC_KEYS", public_keys);
        });

        socket.on("GET_USERS", function(){
           var ring_users = getUsersSocialInfoByRing(ring);
            socket.emit("GET_USERS", ring_users);
        });

    };

    /***
     * Sending a message to all of the users of ring group.
     * @param msg_type - type of message to broadcast.
     * @param msg - the msg to send.
     * @param ring
     * @param socket - the current user socket (to make sure we don't send him the message too.
     */
    function broadcastRingMessage(msg_type, msg, ring, socket){

        for (var ring_socket in sockets_by_ring[ring]) {

            if (ring_socket != socket) {
                ring_socket.emit(msg_type, msg.toJSON());
            }
        }
    };

    /***
     *  Exports the function run to use by requiring the module server.js
     */
    return{
        run: run
    };
}
