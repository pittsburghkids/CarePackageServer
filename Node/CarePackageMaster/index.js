const express = require('express');
var app = express();
var server = require('http').Server(app);

var io = require('socket.io')(server);

app.use(express.static('public'));
server.listen(4000);

io.on('connection', function (socket) {

    console.log("Client connected.");

    socket.on('data', data => {
        console.log(data);

        socket.broadcast.emit('data', data);

    });

    socket.on('disconnect', () => {
        console.log("Client disconnected.");
    });

});