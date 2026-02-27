# Hardware Keypad Integration Guide

## Overview
This guide explains how to integrate a hardware keypad with the Smart Home system so that OTP input from the keypad appears directly on the website in real-time.

## Hardware Requirements

### Option 1: 3x4 Matrix Keypad (Recommended)
- Standard phone-style keypad
- 12 keys: 0-9, *, #
- 7 pins (4 rows + 3 columns)

### Option 2: 4x4 Matrix Keypad
- 16 keys: 0-9, A-D, *, #
- 8 pins (4 rows + 4 columns)

### ESP32 Board
- Any ESP32 development board
- WiFi capability (built-in)

### Required Libraries
1. **Keypad** library by Mark Stanley
2. **WebSocketsClient** library by Markus Sattler

## Wiring Diagram

### 3x4 Keypad to ESP32

```
Keypad Pin  →  ESP32 GPIO
Row 1       →  GPIO 13
Row 2       →  GPIO 12
Row 3       →  GPIO 14
Row 4       →  GPIO 27
Col 1       →  GPIO 26
Col 2       →  GPIO 25
Col 3       →  GPIO 33
```

**Note:** You can use different GPIO pins, just update the code accordingly.

## Installation Steps

### 1. Install Arduino Libraries

Open Arduino IDE and install these libraries:
- Go to **Sketch → Include Library → Manage Libraries**
- Search and install:
  - "Keypad" by Mark Stanley
  - "WebSockets" by Markus Sattler

### 2. Configure the Code

Open `esp32/keypad_3x4.ino` and update:

```cpp
// Your WiFi credentials
const char* ssid = "Keerthi";
const char* password = "Madhumitha";

// Your computer's IP address (where Node.js server is running)
const char* ws_host = "192.168.1.100"; // CHANGE THIS!
```

**To find your computer's IP:**
- Windows: Open CMD and type `ipconfig`
- Look for "IPv4 Address" under your WiFi adapter
- Example: 192.168.1.100

### 3. Upload to ESP32

1. Connect ESP32 to computer via USB
2. Select board: **Tools → Board → ESP32 Dev Module**
3. Select port: **Tools → Port → COM[X]**
4. Click **Upload**

### 4. Start the Server

Make sure your Node.js server is running:
```bash
npm start
```

## How It Works

### Key Functions

| Key | Function |
|-----|----------|
| 0-9 | Enter OTP digits (max 6 digits) |
| #   | Submit OTP for verification |
| *   | Clear current OTP input |

### Workflow

1. **User presses digit on keypad** → ESP32 sends to server via WebSocket
2. **Server broadcasts to website** → Digit appears in OTP input field
3. **After 6 digits** → Auto-submits for verification
4. **Or press #** → Manual submit

### Real-Time Communication

```
Hardware Keypad (ESP32)
    ↓ WebSocket
Node.js Server
    ↓ Socket.IO
Website (Browser)
```

## Testing

### 1. Monitor Serial Output

Open **Tools → Serial Monitor** (115200 baud) to see:
```
=== ESP32 Keypad Integration ===
Connecting to WiFi....
✓ Connected to WiFi
IP Address: 192.168.1.105
Connecting to WebSocket server: 192.168.1.100:3000
✓ WebSocket Connected

=== Keypad Ready ===
Press 0-9: Enter OTP digits
Press #: Submit OTP
Press *: Clear OTP
========================
```

### 2. Test Key Presses

Press keys on the keypad and watch:
- Serial monitor shows key presses
- Website OTP field updates in real-time

### 3. Test OTP Verification

1. Generate OTP on website
2. Enter OTP using keypad
3. Press # or wait for auto-submit
4. Verify access is granted

## Troubleshooting

### Keypad Not Responding
- Check wiring connections
- Verify GPIO pin numbers in code
- Test keypad with simple sketch first

### WebSocket Not Connecting
- Verify server IP address is correct
- Check both devices are on same WiFi network
- Ensure Node.js server is running
- Check firewall settings

### Digits Not Appearing on Website
- Open browser console (F12) to check for errors
- Verify Socket.IO connection in browser
- Check server logs for WebSocket messages

### Wrong Keys Detected
- Keypad matrix might be different
- Adjust the `keys` array in code to match your keypad layout

## Advanced Configuration

### Change OTP Length

In `keypad_3x4.ino`:
```cpp
if (otpBuffer.length() < 6) {  // Change 6 to desired length
```

### Add Buzzer Feedback

```cpp
#define BUZZER_PIN 16

void setup() {
  pinMode(BUZZER_PIN, OUTPUT);
}

void sendKeypadDigit(char digit) {
  // Beep on key press
  digitalWrite(BUZZER_PIN, HIGH);
  delay(50);
  digitalWrite(BUZZER_PIN, LOW);
  
  // Send to server...
}
```

### Add LED Indicator

```cpp
#define LED_PIN 2

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_CONNECTED:
      digitalWrite(LED_PIN, HIGH);  // LED on when connected
      break;
    case WStype_DISCONNECTED:
      digitalWrite(LED_PIN, LOW);   // LED off when disconnected
      break;
  }
}
```

## Security Considerations

1. **Use HTTPS/WSS in production** - Current setup uses unencrypted WebSocket
2. **Validate OTP server-side** - Never trust client input alone
3. **Rate limiting** - Prevent brute force attacks
4. **OTP expiration** - Implement time-based expiration
5. **Secure WiFi** - Use WPA2/WPA3 encryption

## Integration with Door Control

The keypad system works alongside the existing door control:

1. **Keypad OTP Entry** → Verifies user identity
2. **Facial Recognition** → Additional security layer
3. **Door Unlock** → ESP32 controls servo motor

All three systems communicate through the Node.js server.

## Files Reference

- `esp32/keypad_3x4.ino` - Main keypad code (3x4 matrix)
- `esp32/keypad_integration.ino` - Alternative 4x4 matrix version
- `server.js` - WebSocket handlers
- `public/app.js` - Frontend keypad input handling

## Support

For issues or questions:
1. Check Serial Monitor output
2. Verify all connections
3. Test each component separately
4. Review server logs
