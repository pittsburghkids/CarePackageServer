#include <PacketSerial.h>
#include <Wire.h>
#include <SPI.h>
#include <Adafruit_PN532.h>

/*
   Begin Settings
*/

//#define DEBUG     // Uncoment to print raw values to serial instead of using COBS.
//#define TAG_ONLY  // Print only the tag in DEBUG mode, useful for programming tags.
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


// Union to see values as bytes or
typedef union id
{
  uint64_t value;
  byte     bytes[8];
};

bool tagPresent = false;
id tagID;
id newTagID;
uint32_t tagTime;

uint8_t success;

void(* resetFunc) (void) = 0;

void setup(void) {

  Serial.begin(115200);
  packetSerial.setStream(&Serial);

  sendMessage(BOARD_SEARCH);
  nfc.begin();

  // Try to talk to reader.
  uint32_t versiondata = nfc.getFirmwareVersion();
  if (!versiondata) {
    sendMessage(BOARD_MISSING);
    delay(1000);
    resetFunc();    
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
  uint8_t uid[] = { 0, 0, 0, 0, 0, 0, 0 };
  uint8_t uidLength;

  // Remove timed-out cards.
  if (tagPresent && (millis() - tagTime > TIMEOUT)) {
    sendTagMessage(TAG_REMOVED, tagID);
    tagPresent = false;
  }


  // Detect new cards.
  success = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength);

  if (success) {

    // Only watch for 4-byte an 7-byte ids.
    if (uidLength == 4 || uidLength == 7)
    {

      memcpy(&newTagID.bytes, &uid, 7);

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
#if defined(DEBUG)
  Serial.println(type);
#else
  packetSerial.send(&type, 1);
#endif
}

void sendTagMessage(byte type, id tag) {

#if defined(DEBUG) && defined(TAG_ONLY)
  if (type == TAG_FOUND) {
    
  Serial.print("");
  for (int i = 0; i < 7; i++) {
    char hexString[2] = {0, 0};
    sprintf(hexString, "%02X", tag.bytes[i]);
    Serial.print(strupr(hexString));
  }
  Serial.println(""); 
  }
#endif

#if defined(DEBUG) && !defined(TAG_ONLY)
  Serial.print("Type: ");
  Serial.print(type);
  Serial.print(" ");
  Serial.print("HEX: ");

  for (int i = 0; i < 7; i++) {
    char hexString[2] = {0, 0};
    sprintf(hexString, "%02X", tag.bytes[i]);
    Serial.print(strupr(hexString));
  }
  Serial.println("");
#endif

#if !defined(DEBUG) && !defined(TAG_ONLY)
  size_t byteCount = 8;
  byte bytes[byteCount];

  memcpy(&bytes[0], &type, 1);
  memcpy(&bytes[1], &tag.bytes, 7);

  packetSerial.send(bytes, byteCount);
#endif

}
