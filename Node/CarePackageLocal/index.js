'use strict';

// Read config.
const fs = require('fs');
let configJSON = fs.readFileSync('public/config.json');
let config = JSON.parse(configJSON);

// WebSocketServer handles network activity.
let WebSocketServer = require('./lib/webSocketServer');
let webSocketServer = new WebSocketServer();

// SocketIO Client talks to main server.
let SocketIOClient = require('./lib/socketIOClient');
let socketIOClient = new SocketIOClient();

// SerialReader handles incoming data from the Arduinos.
let SerialReader = require('./lib/serialReader');
let serialReader = new SerialReader();

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