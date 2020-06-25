#include <PacketSerial.h>
#include <Encoder.h>

/*
   Begin Settings
*/

//#define DEBUG     // Uncoment to print raw values to serial instead of using COBS.

/*
   End Settings
*/

#define ENCODER_COUNTS_PER_REVOLUTION 4096
#define ENCODER_STEPS 4

#define BOARD_SEARCH 100
#define BOARD_MISSING 101
#define BOARD_FOUND 102
#define BOARD_READY 103

#define ENCODER_UPDATE 200

Encoder encoderA = Encoder(2, 4);
Encoder encoderB = Encoder(3, 5);

PacketSerial packetSerial;

byte encoderValueA;
byte encoderValueB;

void setup(void) {
  Serial.begin(115200);
  packetSerial.setStream(&Serial);
  
  // Ready to read.
  sendMessage(BOARD_READY);
}


void loop(void) {

  // Encoder A

  long valueA = encoderA.read();
  byte byteValueA = valueA / (ENCODER_COUNTS_PER_REVOLUTION/ENCODER_STEPS);
  
  if (byteValueA != encoderValueA) {
    sendEncoderMessage(ENCODER_UPDATE, 0, byteValueA);
    encoderValueA = byteValueA;
  }

  // Encoder B

  long valueB = encoderB.read();
  byte byteValueB = valueB / (ENCODER_COUNTS_PER_REVOLUTION/ENCODER_STEPS);
      
  if (byteValueB != encoderValueB) {
    sendEncoderMessage(ENCODER_UPDATE, 1, byteValueB);
    encoderValueB = byteValueB;
  }


  // COBS Update.
  packetSerial.update();
}

void sendMessage(byte type) {
#if defined(DEBUG)
  Serial.println(type);
#else
  packetSerial.send(&type, 1);
#endif
}

void sendEncoderMessage(byte type, byte id, byte value) {
#if defined(DEBUG)
  Serial.print(type);
  Serial.print(" ");
  Serial.print(id);  
  Serial.print(" ");
  Serial.println(value);
#else

  size_t byteCount = 3;
  byte bytes[byteCount];

  bytes[0] = type;
  bytes[1] = id;
  bytes[2] = value;

  packetSerial.send(bytes, byteCount);
#endif

}
