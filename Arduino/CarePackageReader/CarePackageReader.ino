#define MIFAREDEBUG

#include <Wire.h>
#include <SPI.h>
#include <Adafruit_PN532.h>

// SPI
#define PN532_SCK  (2)
#define PN532_MOSI (3)
#define PN532_SS   (4)
#define PN532_MISO (5)

// I2C
//#define PN532_IRQ   (2)
//#define PN532_RESET (3)

// SPI
Adafruit_PN532 nfc(PN532_SCK, PN532_MISO, PN532_MOSI, PN532_SS);

// I2C
//Adafruit_PN532 nfc(PN532_IRQ, PN532_RESET);

void setup(void) {

  Serial.begin(115200);
  Serial.println("Looking for board...");

  nfc.begin();

  uint32_t versiondata = nfc.getFirmwareVersion();
  if (!versiondata) {
    Serial.print("Didn't find PN53x board.");
    while (1); // Halt.
  }

  // Found Reader.
  Serial.print("Found chip PN5"); Serial.println((versiondata >> 24) & 0xFF, HEX);
  Serial.print("Firmware version "); Serial.print((versiondata >> 16) & 0xFF, DEC);
  Serial.print('.'); Serial.println((versiondata >> 8) & 0xFF, DEC);

  // Configure board to read RFID tags.
  nfc.SAMConfig();

  Serial.println("Waiting for tag...");
}


void loop(void) {
  uint8_t success;
  uint8_t uid[] = { 0, 0, 0, 0, 0, 0, 0 };
  uint8_t uidLength;

  success = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength);

  if (success) {

    long uidLong = 0;

    for (int i = 0; i < uidLength; i++) {
      uidLong += (long)uid[i] << i * 8;
    }

    Serial.println(uidLong, DEC);

    delay(250);
  }
}
