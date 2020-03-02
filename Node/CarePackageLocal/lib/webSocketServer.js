const EventEmitter = require('events');

class WebSocketServer extends EventEmitter {

    constructor() {
        super();

        const express = require('express');
        const app = express();
        const server = require('http').createServer(app);

        app.use(express.static('public'));

        // Websocket setup.
        this.WebSocket = require('ws');
        this.wss = new this.WebSocket.Server({ server });

        // Listen for connections.
        const port = process.env.PORT || 8080;
        server.listen(port, () => console.log(`Listening on port ${port}!`));

        // Handle new connections.        

        this.wss.on('connection', (ws) => {
            console.log("Client connected.");
            ws.alive = true;

            // Handle client keep-alive.
            ws.on('pong', () => {
                ws.alive = true;
            });

            // Handle client messages.
            ws.on('message', (data) => {

                console.log(data);

                this.emit("data", data);

                this.wss.clients.forEach((client) => {
                    if (client !== ws && client.readyState === this.WebSocket.OPEN) {
                        client.send(data);
                    }
                });

            });

        });

        // Cull idle clients.
        const interval = setInterval(() => {
            this.wss.clients.forEach((ws) => {
                if (ws.alive === false) {
                    console.log("Culling client.");
                    return ws.terminate();
                }
                ws.alive = false;
                ws.ping(() => { });
            });
        }, 30000);

    }

    // Broadcast serial data.
    broadcast(data) {
        this.wss.clients.forEach((client) => {
            if (client.readyState === this.WebSocket.OPEN) {
                client.send(data);
            }
        });
    };

}

module.exports = WebSocketServer;