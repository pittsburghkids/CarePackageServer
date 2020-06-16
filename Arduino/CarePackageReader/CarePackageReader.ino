#define MIFAREDEBUG

#include <Wire.h>
#include <SPI.h>
#include <Adafruit_PN532.h>

// SPI
// #define PN532_SCK  (2)
// #define PN532_MOSI (3)
// #define PN532_SS   (4)
// #define PN532_MISO (5)

// SPI
//Adafruit_PN532 nfc(PN532_SCK, PN532_MISO, PN532_MOSI, PN532_SS);

// I2C
#define PN532_IRQ   (2)
#define PN532_RESET (3)

// I2C
Adafruit_PN532 nfc(PN532_IRQ, PN532_RESET);

void setup(void) {

  Serial.begin(115200);
  
  Serial.println("Looking for board...");
  nfc.begin();

  // Try to talk to reader.
  uint32_t versiondata = nfc.getFirmwareVersion();
  if (!versiondata) {
    Serial.print("Didn't find PN53x board.");
    while (1); // Halt.
  }

  // Found reader.
  Serial.print("Found chip PN5"); Serial.println((versiondata >> 24) & 0xFF, HEX);
  Serial.print("Firmware version "); Serial.print((versiondata >> 16) & 0xFF, DEC);
  Serial.print('.'); Serial.println((versiondata >> 8) & 0xFF, DEC);

  // Configure board to read RFID tags.
  nfc.SAMConfig();

  // Ready to read.
  Serial.println("Waiting for tag...");
}


void loop(void) {
  uint8_t success;
  uint8_t uid[] = { 0, 0, 0, 0, 0, 0, 0 };
  uint8_t uidLength;

  success = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength);

  if (success) {

    if (uidLength == 4)
    {
      uint32_t cardid = uid[0];
      cardid <<= 8;
      cardid |= uid[1];
      cardid <<= 8;
      cardid |= uid[2];  
      cardid <<= 8;
      cardid |= uid[3]; 
      Serial.println(cardid);
    }

    delay(250);
  }
}
