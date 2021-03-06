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

    var myDB = getDB();
    function getDB () {
        //todo: find another env..
        var db;
        if(process.env.PORT){
            db = require('./postgres_server_db');
        }
        else {
            db = require('./server_db.js');
        }
        db.init();
        return db;
    }

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

    app.get('/welcome', function(req, res){
        res.sendFile(__dirname + '/welcome_page.html');
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
         res.send(joinRing(user));
    });

    /***
     * Returns the list of available rings.
     */
    app.get('/chats', jsonParser ,function(req,res){
        var result = myDB.getRingsList();
        res.send(result);
    });

    /**
     * Returns the public_key social_id and encrypted_private_key for each user of the ring
     * The req.body must contains the following:
     * {
     *  ring: ring (string)
     * }
     */
    app.post('/chat_credentials', jsonParser ,function(req,res){
        var users_info = myDB.getAllUsersInfo(req.body.ring);
        console.log("chat_credentials");
        console.log(users_info);
        // Return for each user the public key , social_id and encrypted_private_key
        res.send( users_info);
    });

    /**
     * Returns the rings that the user is registered to.
     * The req.body must contains the following:
     * {
     *  social_id: value
     *  social_type: value (facebook/twiter/..)
     *  token: value
     * }
     */
    app.post('/my_rings', jsonParser ,function(req,res){

        // Validate if registered
        var user = req.body;
        var rings_info = myDB.getUserRings(user.social_id, user.social_type);
        if (rings_info == []){

            res.send( {is_registered:false});
        }

        // Validate the user Token
        if (!validateUserToken(user.social_id, user.social_type, user.token )){
            res.send( {is_registered:false});
        }

        // Return the user its public key and encrypted_private_key
        res.send({rings:rings_info, is_registered:true});
    });

    this.sockets_by_ring = {};

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

        console.log("add user socket by ring");
        user_socket.join(ring.toLowerCase());

        if (this.sockets_by_ring[ring.toLowerCase()] == undefined ){
            this.sockets_by_ring[ring.toLowerCase()] = [];
        }

        this.sockets_by_ring[ring.toLowerCase()].push(user_socket);
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
        io.on('connection', function(socket){

            socket.on("CHAT", function(msg){
                // Add the user socket to the users list by the token
                addUserSocketByRing(msg.ring, socket);
                handleUserMessage(socket, msg.ring);
            });
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

        // Publish to every ring member the new user details

        var user_to_publish = {
            social_id: user.social_id,
            social_type: user.social_type,
            public_key: user.public_key
        };

        broadcastRingMessage("NEW_USER",user_to_publish, user.ring.toLowerCase(), null);

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
            broadcastRingMessage("RECEIVE_MSG", msg, ring, socket);
        });

        socket.on("PUBLIC_KEYS", function(){
            var public_keys = myDB.getPublicKeysByRing(ring);
            socket.emit("PUBLIC_KEYS", public_keys);
        });

        socket.on("GET_USERS", function(){
           var ring_users = myDB.getUsersSocialInfoByRing(ring);
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

        if (this.sockets_by_ring[ring.toLowerCase()] == undefined){
            return;
        }

        for (var socket_index = 0; socket_index< this.sockets_by_ring[ring.toLowerCase()].length; socket_index++){

            if (socket != this.sockets_by_ring[ring.toLowerCase()][socket_index]){
                this.sockets_by_ring[ring.toLowerCase()][socket_index].emit(msg_type, msg);
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
