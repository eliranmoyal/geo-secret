/**
 * Created by Hila on 23/12/2015.
 */

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.set('port', (process.env.PORT || 3000));
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/chat-example/index.html');
});

app.get('/privacy', function(req, res){
    res.sendFile(__dirname + '/public/privacy_policy.html');
});

io.on('connection', function(socket){

    console.log('a user connected');

    socket.on('chat message', function(msg){
        console.log('message: ' + msg);
        io.emit('chat message', msg);
    });

    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
});

http.listen(app.get('port'), function(){
    console.log('listening on *:3000');
});
