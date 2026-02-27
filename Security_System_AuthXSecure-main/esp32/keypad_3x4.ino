#include <WiFi.h>
#include <WebSocketsClient.h>
#include <Keypad.h>

// WiFi credentials
const char* ssid = "Keerthi";
const char* password = "Madhumitha";

// WebSocket server (Node.js server IP)
const char* ws_host = "192.168.1.100"; // CHANGE THIS to your computer's IP
const int ws_port = 3000;

WebSocketsClient webSocket;

// Keypad configuration (3x4 matrix - standard phone keypad)
const byte ROWS = 4;
const byte COLS = 3;

char keys[ROWS][COLS] = {
  {'1','2','3'},
  {'4','5','6'},
  {'7','8','9'},
  {'*','0','#'}
};

// Pin connections (adjust based on your ESP32 wiring)
// Rows: GPIO pins for rows
byte rowPins[ROWS] = {13, 12, 14, 27};
// Cols: GPIO pins for columns
byte colPins[COLS] = {26, 25, 33};

Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

String otpBuffer = "";
bool connected = false;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n=== ESP32 Keypad Integration ===");
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\n✓ Connected to WiFi");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  
  // Initialize WebSocket
  Serial.print("Connecting to WebSocket server: ");
  Serial.print(ws_host);
  Serial.print(":");
  Serial.println(ws_port);
  
  webSocket.begin(ws_host, ws_port, "/socket.io/?EIO=4&transport=websocket");
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
  
  Serial.println("\n=== Keypad Ready ===");
  Serial.println("Press 0-9: Enter OTP digits");
  Serial.println("Press #: Submit OTP");
  Serial.println("Press *: Clear OTP");
  Serial.println("========================\n");
}

void loop() {
  webSocket.loop();
  
  char key = keypad.getKey();
  
  if (key) {
    Serial.print("Key pressed: ");
    Serial.println(key);
    
    if (key >= '0' && key <= '9') {
      // Numeric key - add to OTP buffer
      if (otpBuffer.length() < 6) {
        otpBuffer += key;
        sendKeypadDigit(key);
        
        Serial.print("OTP Buffer: ");
        Serial.print(otpBuffer);
        Serial.print(" (");
        Serial.print(otpBuffer.length());
        Serial.println("/6)");
        
        // Auto-submit when 6 digits entered
        if (otpBuffer.length() == 6) {
          Serial.println("6 digits entered - Auto-submitting...");
          delay(500);
          submitOTP();
        }
      } else {
        Serial.println("Buffer full! Press # to submit or * to clear");
      }
    }
    else if (key == '#') {
      // Submit OTP
      Serial.println("Submit key pressed");
      submitOTP();
    }
    else if (key == '*') {
      // Clear OTP
      Serial.println("Clear key pressed");
      clearOTP();
    }
  }
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("❌ WebSocket Disconnected");
      connected = false;
      break;
      
    case WStype_CONNECTED:
      Serial.println("✓ WebSocket Connected");
      connected = true;
      // Send Socket.IO handshake
      webSocket.sendTXT("40");
      break;
      
    case WStype_TEXT:
      Serial.printf("← Message: %s\n", payload);
      break;
      
    case WStype_ERROR:
      Serial.println("❌ WebSocket Error");
      break;
  }
}

void sendKeypadDigit(char digit) {
  if (!connected) {
    Serial.println("⚠ Not connected to server");
    return;
  }
  
  // Send Socket.IO event: keypad-input
  String message = "42[\"keypad-input\",{\"digit\":\"" + String(digit) + "\"}]";
  webSocket.sendTXT(message);
  Serial.println("→ Sent digit to website");
}

void clearOTP() {
  otpBuffer = "";
  
  if (connected) {
    // Send Socket.IO event: keypad-clear
    webSocket.sendTXT("42[\"keypad-clear\",{}]");
    Serial.println("→ Clear command sent to website");
  }
  
  Serial.println("✓ OTP buffer cleared");
}

void submitOTP() {
  if (otpBuffer.length() == 0) {
    Serial.println("⚠ No OTP to submit");
    return;
  }
  
  if (!connected) {
    Serial.println("⚠ Not connected to server");
    return;
  }
  
  // Send Socket.IO event: keypad-submit
  String message = "42[\"keypad-submit\",{\"otp\":\"" + otpBuffer + "\"}]";
  webSocket.sendTXT(message);
  Serial.println("→ OTP submitted: " + otpBuffer);
  
  // Clear buffer after submit
  delay(1000);
  otpBuffer = "";
  Serial.println("✓ Buffer cleared after submit\n");
}
