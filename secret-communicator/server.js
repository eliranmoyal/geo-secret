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

    //TODO: remove this, just checking
/*    console.log("new User: " + JSON.stringify(myDB.addNewUser("id1","social1","public","private","yavne")));
    myDB.addNewUser("id2","social2","public2","private2","yavne");
    myDB.addNewUser("id3","social3","public3","private3","rishon");
    console.log("rings list: " + JSON.stringify(myDB.getRingsList()));
    console.log("public keys: " + JSON.stringify(myDB.getPublicKeysByRing("yavne")));
    console.log("users info: " + JSON.stringify(myDB.getUsersSocialInfoByRing("yavne")));
    console.log("exists user info: " + JSON.stringify(myDB.getUserInfo("id1", "social1","yavne")));
    console.log("not exists user info: " + JSON.stringify(myDB.getUserInfo("id", "social","yavne")));*/

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

    var bodyParser = require('body-parser');
    var jsonParser = bodyParser.json();
    app.use( bodyParser.json() );       // to support JSON-encoded bodies
    // parse application/x-www-form-urlencoded 
    app.use(bodyParser.urlencoded({ extended: false }))

    /**
     * Register the site.
     * The req.body must contains the following:
     * {
     *  social_id: value
     *  social_type: value (facebook/twiter/..)
     *  public_key: value
     *  encrypted_private_key: value
     *  ring: value
     *  token: value
     * }
     */
     app.post('/register', jsonParser ,function(req,res){
         var user = req.body;
         console.log(user);
         res.send(joinRing(user));
    });

    /***
     * Returns the list of available rings.
     */
    app.get('/chats', jsonParser ,function(req,res){
        var result = myDB.getRingsList();
        console.log(result);
        res.send(result);
    });

    /**
     * Returns the public_key and encrypted_private_key of the user.
     * The req.body must contains the following:
     * {
     *  social_id: value
     *  social_type: value (facebook/twiter/..)
     *  token: value
     *  ring: ring
     * }
     */
    app.post('/chat_credentials', jsonParser ,function(req,res){

        // Validate if registered
        var user = req.body;
        var user_info = myDB.getUserInfo(user.social_id, user.social_type, user.ring);
        if (user_info == []){

            return {is_registered:false};
        }

        // Validate the user Token
        if (!validateUserToken(user.social_id, user.social_type, user.token )){
            return {is_registered:false}; //todo: maybe return other error
        }

        // Return the user its public key and encrypted_private_key
        return {public_key:user_info.public_key, encrypted_private_key:user_info.encrypted_private_key, is_registered:true};
    });

    var sockets_by_ring = [];

    /*******************************Help Methods********************************/

    /***
     */
    function validateUserToken(social_id,social_type,token){
        // todo: implement
        return true;
    }

    /***
     * Adds an active socket of a user to sockets_by_ring
     * @param ring
     * @param user_socket
     */
    function addUserSocketByRing(ring, user_socket){

        socket.join(ring.toLowerCase());
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
        // handle connection of /chat
        io.of('/chat').on('connection', function(socket){

            // Add the user socket to the users list by the token
            addUserSocketByRing(socket.handshake.query.ring, socket);
            handleUserMessage(socket, socket.handshake.query.ring);
        })
    };

    /***
     * Handle a first join to a ring
     * @param user - the params from the url query {social_id,social_type,public_key,ring,token}.
     */
    function joinRing(user){
        console.log('a user joined a ring');

        if (!validateUserToken(user.token)){
            return {success: false};
        }

        myDB.addNewUser(user.social_id, user.social_type, user.public_key, user.encrypted_private_key, user.ring.toLowerCase());
        console.log(user);

        // Publish to every ring member the new user details

        var user_to_publish = {
            social_id: user.social_id,
            social_type: user.social_type,
            public_key: user.public_key
        };

        broadcastRingMessage("NEW_USER",user_to_publish, user.ring);

        return {success: true};

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
            var public_keys = myDB.getPublicKeysByRing(ring);
            console.log(public_keys);
            socket.emit("PUBLIC_KEYS", public_keys);
        });

        socket.on("GET_USERS", function(){
           var ring_users = myDB.getUsersSocialInfoByRing(ring);
            console.log(ring_users);
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
    function broadcastRingMessage(msg_type, msg, ring){

        io.to(ring).emit(msg_type, msg.toJSON());
        /*for (var ring_socket in sockets_by_ring[ring]) {

            if (ring_socket != socket) {
                ring_socket.emit(msg_type, msg.toJSON());
            }
        }*/
    };

    /***
     *  Exports the function run to use by requiring the module server.js
     */
    return{
        run: run
    };
}
