const EventEmitter = require('events');

class SerialReader extends EventEmitter {

    constructor() {
        super();

        this.SerialPort = require('serialport');
        this.Readline = require('@serialport/parser-readline');
        this.ActiveSerialPorts = {};

        this.checkTags();
        this.findArduinos();

        setInterval(() => {
            this.findArduinos();
        }, 5000);

        setInterval(() => {
            this.checkTags();
        }, 500);
    }

    checkTags() {

        for (let key in this.ActiveSerialPorts) {
            let port = this.ActiveSerialPorts[key];

            if (port.lastValue != undefined && port.lastValueTime < Date.now() - 500) {
                let data = {
                    type: "tag.removed",
                    rfidValue: port.lastValue,
                    boardSerialNumber: port.serialNumber
                }
                this.emit("data", data);

                port.lastValue = undefined;
            }
        }
    }

    findArduinos() {
        console.log("Looking for Arduinos.");


        const SerialPort = require('serialport');

        SerialPort.list().then(ports => {
            ports.forEach((port) => {
                if (port.manufacturer != undefined && port.manufacturer.indexOf("Arduino" > -1)) {

                    if (this.ActiveSerialPorts[port.serialNumber] != undefined) {
                        console.log("Arduino already active: " + port.serialNumber);
                        return;
                    }

                    console.log("Arduino found: " + port.serialNumber);

                    // Configure serial port.
                    let serialPort = new this.SerialPort(port.path, { baudRate: 115200 });

                    serialPort.on('open', () => {
                        console.log("Serial port opened: " + port.path);
                        this.ActiveSerialPorts[port.serialNumber] = port;
                    });

                    serialPort.on('close', () => {
                        console.log("Serial port closed: " + port.path);
                        delete this.ActiveSerialPorts[port.serialNumber];
                    });

                    // Set up serial port reading.
                    const parser = new this.Readline();
                    serialPort.pipe(parser);

                    // Read serial data.
                    parser.on('data', line => {
                        let value = Number.parseInt(line);
                        if (Number.isInteger(value)) {

                            if (value != port.lastValue) {

                                let data = {
                                    type: "tag.found",
                                    rfidValue: value,
                                    boardSerialNumber: port.serialNumber
                                }

                                this.emit("data", data);
                            }

                            port.lastValue = value;
                            port.lastValueTime = Date.now();
                        }
                    })
                }
            });
        });
    }
}

module.exports = SerialReader;