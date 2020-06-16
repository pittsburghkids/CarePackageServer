#include <PacketSerial.h>
#include <Wire.h>
#include <SPI.h>
#include <Adafruit_PN532.h>

/*
   Begin Settings
*/

//#define DEBUG       // Uncoment to print raw values to serial instead of using COBS.
#define RETRIES 16  // Number of tries per loop for the NFC reader.
#define TIMEOUT 100 // Removed message sent after this time without seeing tag.

/*
   End Settings
*/

#define PN532_IRQ   (2)
#define PN532_RESET (3)
Adafruit_PN532 nfc(PN532_IRQ, PN532_RESET);

#define TAG_REMOVED 0
#define TAG_FOUND 1

#define BOARD_SEARCH 100
#define BOARD_MISSING 101
#define BOARD_FOUND 102
#define BOARD_READY 103

PacketSerial packetSerial;

typedef union id
{
  uint32_t value;
  byte     bytes[4];
};

bool tagPresent = false;
id tagID;
id newTagID;
uint32_t tagTime;

uint8_t success;
uint8_t uid[] = { 0, 0, 0, 0, 0, 0, 0 };
uint8_t uidLength;

void setup(void) {

  Serial.begin(115200);
  packetSerial.setStream(&Serial);

  sendMessage(BOARD_SEARCH);
  nfc.begin();

  // Try to talk to reader.
  uint32_t versiondata = nfc.getFirmwareVersion();
  if (!versiondata) {
    sendMessage(BOARD_MISSING);
    while (1); // Halt.
  }

  sendMessage(BOARD_FOUND);

  // Configure board to read RFID tags.
  nfc.SAMConfig();

  // Retry count per loop.
  nfc.setPassiveActivationRetries(RETRIES);

  // Ready to read.
  sendMessage(BOARD_READY);
}


void loop(void) {
  // Remove timed-out cards.
  if (tagPresent && (millis() - tagTime > TIMEOUT)) {
    sendTagMessage(TAG_REMOVED, tagID);
    tagPresent = false;
  }


  // Detect new cards.
  success = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength);

  if (success) {

    // Only watch for 4-byte mifare cards.
    if (uidLength == 4)
    {
      // Calculate card ID.
      newTagID.bytes[0] = uid[0];
      newTagID.bytes[1] = uid[1];
      newTagID.bytes[2] = uid[2];
      newTagID.bytes[3] = uid[3];

      byte messageType;

      if (tagPresent && (newTagID.value != tagID.value)) {
        // Remove old tag.
        sendTagMessage(TAG_REMOVED, tagID);

        // Add new tag.
        tagID = newTagID;
        sendTagMessage(TAG_FOUND, tagID);
      }

      if (!tagPresent) {
        tagID = newTagID;
        sendTagMessage(TAG_FOUND, tagID);
        tagPresent = true;
      }

      tagTime = millis();

    }
  }

  packetSerial.update();
}

void sendMessage(byte type) {
  packetSerial.send(&type, 1);
}

void sendTagMessage(byte type, id tag) {
  size_t byteCount = 5;
  byte bytes[byteCount];

  memcpy(&bytes[0], &type, 1);
  memcpy(&bytes[1], &tag.bytes, 4);

  packetSerial.send(bytes, byteCount);
}
