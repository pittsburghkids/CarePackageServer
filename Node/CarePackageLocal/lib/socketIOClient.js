const EventEmitter = require('events');

class SocketIOClient extends EventEmitter {

    constructor() {
        super();

        this.socket = require('socket.io-client')('http://carepackagedepot.local:4000');

        this.socket.on('connect', () => {
            console.log("socket.io connect");
        });

        this.socket.on('data', (data) => {
            this.emit("data", data);
        });

        this.socket.on('disconnect', () => {
            console.log("socket.io disconnect");
        });

    }

    send(data) {
        this.socket.emit("data", data);
    }

}

module.exports = SocketIOClient;