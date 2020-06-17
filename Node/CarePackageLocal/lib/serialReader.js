const EventEmitter = require('events');

class SerialReader extends EventEmitter {

    SerialPort = require('serialport');

    cobs = require('cobs');

    ActiveSerialPorts = {};

    constructor() {
        super();

        this.findArduinos();

        setInterval(() => {
            this.findArduinos();
        }, 5000);

    }

    findArduinos() {
        console.log("Looking for Arduinos.");
        this.SerialPort.list((err, ports) => {
            ports.forEach((port) => {
                if (port.manufacturer != undefined && port.manufacturer.indexOf("Arduino" > -1)) {

                    if (this.ActiveSerialPorts[port.comName] != undefined) {
                        console.log("Arduino already active: " + port.serialNumber + " " + port.comName);
                        return;
                    }

                    console.log("Arduino found: " + port.serialNumber + " " + port.comName);

                    // Configure serial port.
                    let serialPort = new this.SerialPort(port.comName, { baudRate: 115200 });

                    serialPort.on('open', () => {
                        console.log("Serial port opened: " + port.comName);
                        this.ActiveSerialPorts[port.comName] = port;
                    });

                    serialPort.on('error', (error) => {
                        console.log("Could not open port: " + port.comName + " (" + error + ")");
                    });

                    serialPort.on('close', () => {
                        console.log("Serial port closed: " + port.comName);
                        delete this.ActiveSerialPorts[port.comName];
                    });


                    // Read serial port stream.
                    let parser = this.cobs.decodeStream();
                    serialPort.pipe(parser).on('data', buffer => {

                        // Board messages.
                        if (buffer.byteLength == 1) {
                            let type = buffer.readUInt8();
                            let typeString = "";

                            switch (type) {
                                case 100: { typeString = "board.searching" } break;
                                case 101: { typeString = "board.missing" } break;
                                case 102: { typeString = "board.found" } break;
                                case 103: { typeString = "board.ready" } break;
                            }

                            let data = {
                                type: typeString,
                                boardSerialNumber: port.serialNumber
                            }

                            console.log(data);
                        }

                        // Tag messages.
                        if (buffer.byteLength == 8) {

                            let type = buffer.slice(0).readUInt8();
                            let value = buffer.slice(1).toString("hex").toUpperCase();;

                            let typeString = (type == 0) ? "tag.removed" : "tag.found";

                            let data = {
                                type: typeString,
                                rfidValue: value,
                                boardSerialNumber: port.serialNumber
                            }

                            this.emit("data", data);
                        }

                    });

                }
            });
        });
    }
}

module.exports = SerialReader;