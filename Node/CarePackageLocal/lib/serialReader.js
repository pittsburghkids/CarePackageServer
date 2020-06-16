const EventEmitter = require('events');

class SerialReader extends EventEmitter {

    SerialPort = require('serialport');

    cobs = require('cobs');
    parser = this.cobs.decodeStream();

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

                    if (this.ActiveSerialPorts[port.serialNumber] != undefined) {
                        console.log("Arduino already active: " + port.serialNumber);
                        return;
                    }

                    console.log("Arduino found: " + port.serialNumber);

                    // Configure serial port.
                    let serialPort = new this.SerialPort(port.comName, { baudRate: 115200 });

                    serialPort.on('open', () => {
                        console.log("Serial port opened: " + port.comName);
                        this.ActiveSerialPorts[port.serialNumber] = port;
                    });

                    serialPort.on('close', () => {
                        console.log("Serial port closed: " + port.comName);
                        delete this.ActiveSerialPorts[port.serialNumber];
                    });

                    // Read serial port stream.
                    serialPort.pipe(this.parser).on('data', buffer => {

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
                        if (buffer.byteLength == 5) {

                            let type = buffer.slice(0).readUInt8();
                            let value = buffer.slice(1).readUInt32LE();

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