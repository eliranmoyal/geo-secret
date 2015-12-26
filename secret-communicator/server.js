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

    app.set('port', (process.env.PORT || 3000));
    app.use(express.static(__dirname + '/public'));

    app.get('/', function(req, res){
        res.sendFile(__dirname + '/index.html');
    });

    app.get('/privacy', function(req, res){
        res.sendFile(__dirname + '/public/privacy_policy.html');
    });

    var users = [];

    /*******************************Help Methods********************************/

    /***
     *  Get's the token of a facebook user by facebook_id
     * @param facebook_id
     * @returns {string} - the token
     */
    function getFacebookToken(facebook_id){
        // todo: implement
        var token = '';
        return token;
    }

    /***
     * Get's the city of a facebook user by facebook_id
     * @param facebook_id
     * @returns {string}
     */
    function getUserCityByFacebookID(facebook_id){
        // todo: implement
        var token = getFacebookToken(facebook_id);
        var city = '';
        return city.toLowerCase();
    }

    /***
     * Removes from users a user by its socket. should be called when a user is disconnected.
     * @param socket - the disconnected user's socket
     */
    function removeUserBySocket(socket){

        for (var users_by_city in users){
            for (var j =0; j < users_by_city.length; j++) {
                if (users_by_city[j].user_socket == socket){
                    delete users_by_city[j]; //todo: check the delete part
                    break;
                }
            }
        }
    }

    /***
     * Get the city of a user by it's socket
     * @param socket - the user's socket.
     * @returns {Function|Buffer.toString} - the city name
     */
    function getUserCityBySocket(socket){

        for (var users_by_city in users){
            for (var j =0; j < users_by_city.length; j++) {
                if (users_by_city[j].user_socket == socket){
                    return users_by_city.name.toString // todo: check the name part
                }
            }
        }
    }

    /***
     * Finds the public keys of a group by city and returns them.
     * @param city
     * @returns {Array} - the public keys
     */
    function getPublicKeysOfGroup(city){

        var public_keys = [];

        for (var user in users[city.toLowerCase()]){
            public_keys.push(user.public_key);
        }

        return public_keys;
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
        io.on('connection', function(socket){

            handleUserConnection(socket);
            handleUserMessage(socket);
            handleUserDisconnection(socket);

        });
    };

    /***
     * Receives the CONNECT msg of a new user and saves it's info in users[].
     * @param socket - the user's socket
     */
    function handleUserConnection(socket){
        console.log('a user connected');
        socket.on("CONNECT", function(msg){

            var user_info = JSON.parse(msg);
            var user_city = getUserCityByFacebookID(user_info.facebook_id);

            user_info.user_city = user_city;
            user_info.user_socket = socket;
            users[user_city].push(user_info);
        });
    };

    /***
     *  Handles user's messages - SEND_MSG (broadcast message to the group) and PUBLIC_KEYS (return to the user the public keys of it's group).
     * @param socket - the user's socket
     */
    function handleUserMessage(socket){
        //todo: remove this later <only before my tests using client.js>
        socket.on('chat message', function(msg){
            console.log('message: ' + msg);
            broadcastGroupMessage(msg, socket);
        });

        socket.on("SEND_MSG", function(msg){
            console.log('message: ' + msg);
            broadcastGroupMessage(msg, socket);
        });

        socket.on("PUBLIC_KEYS", function(facebook_id){
            var group_city = getUserCityByFacebookID(facebook_id);
            var public_keys = getPublicKeysOfGroup(group_city);
            socket.emit("PUBLIC_KEYS", public_keys);
        });

    };

    /***
     *  Handle a disconnection of a user - remove him from the list users[].
     * @param socket
     */
    function handleUserDisconnection(socket){
        socket.on('disconnect', function(){
            console.log('user disconnected');

            //remove the user from the users array.
            removeUserBySocket(socket);
        });
    };

    /***
     * Sending a message to all of the users.
     * @param msg - the message to send
     * @param socket - the sending user's socket
     */
    function broadcastGroupMessage(msg, socket){
        io.emit('chat message', msg); //todo: remove this line

        var city = getUserCityBySocket(socket);
        for (var user in users[city]) {

            if (user.user_socket != socket) {
                user.user_socket.emit("RECEIVE_MSG", msg);
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
