'use strict';

// Read config.
const fs = require('fs');
const configJSON = fs.readFileSync('public/config.json');
const config = JSON.parse(configJSON);

const carePackageMasterServer = getServerByName("CarePackageMaster");

// WebSocketServer handles network activity.
const WebSocketServer = require('./lib/webSocketServer');
const webSocketServer = new WebSocketServer();

// SocketIO Client talks to main server.
const SocketIOClient = require('./lib/socketIOClient');
const socketIOClient = new SocketIOClient(carePackageMasterServer);

// SerialReader handles incoming data from the Arduinos.
const SerialReader = require('./lib/serialReader');
const serialReader = new SerialReader();

socketIOClient.on('data', (data) => {
    // Send data to websocket clients.
    console.log(data);
    webSocketServer.broadcast(data);
});

webSocketServer.on('data', (data) => {
    // Send data to socket.io server.
    socketIOClient.send(data);
});

serialReader.on('data', (data) => {
    // Map RFID id to boxes/items.

    let board = getBoardBySerialNumber(data.boardSerialNumber);
    let item = getItemByRFID(data.rfidValue);
    let box = getBoxByRFID(data.rfidValue);

    if (board != null) {
        data.boardName = board.name;
    }

    if (item != null) {
        data.itemUnicode = item.unicode;
        data.itemName = item.name;
    }

    if (box != null) {
        data.boxName = box.name;
    }

    console.log(data)

    // Convert data to JSON string.
    let dataString = JSON.stringify(data);

    // Send data to socket.io server.
    socketIOClient.send(dataString);

    // Send data to websocket clients.
    webSocketServer.broadcast(dataString);
});

// Find a URL by the server name.

function getServerByName(serverName) {
    for (const server of config.servers) {
        if (server.name == serverName) {
            return server;
        }
    }
    return null;
}

// Find our board by its serial number.
function getBoardBySerialNumber(serialNumber) {
    for (const board of config.boards) {
        if (board.serialNumber == serialNumber) {
            return board;
        }
    }
    return null;
}

// Find our id in the box collection.
function getBoxByRFID(rfid) {
    for (const box of config.boxes) {
        if (box.ids.indexOf(rfid) > -1) {
            return box;
        }
    }
    return null;
}

// Find our id in the item collection.
function getItemByRFID(rfid) {
    for (const item of config.items) {
        if (item.ids.indexOf(rfid) > -1) {
            return item;
        }
    }
    return null;
}