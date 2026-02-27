#include <WiFi.h>
#include <WebSocketsClient.h>
#include <Keypad.h>

// WiFi credentials
const char* ssid = "Keerthi";
const char* password = "Madhumitha";

// WebSocket server (Node.js server)
const char* ws_host = "192.168.1.100"; // Replace with your server IP
const int ws_port = 3000;

WebSocketsClient webSocket;

// Keypad configuration (4x4 matrix)
const byte ROWS = 4;
const byte COLS = 4;

char keys[ROWS][COLS] = {
  {'1','2','3','A'},
  {'4','5','6','B'},
  {'7','8','9','C'},
  {'*','0','#','D'}
};

// Pin connections (adjust based on your wiring)
byte rowPins[ROWS] = {13, 12, 14, 27};
byte colPins[COLS] = {26, 25, 33, 32};

Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

String otpBuffer = "";

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nConnected to WiFi");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
  
  // Initialize WebSocket
  webSocket.begin(ws_host, ws_port, "/socket.io/?EIO=4&transport=websocket");
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
  
  Serial.println("Keypad ready. Press keys to send to website.");
}

void loop() {
  webSocket.loop();
  
  char key = keypad.getKey();
  
  if (key) {
    Serial.print("Key pressed: ");
    Serial.println(key);
    
    if (key >= '0' && key <= '9') {
      // Numeric key - add to OTP buffer
      otpBuffer += key;
      sendKeypadDigit(key);
      
      Serial.print("OTP Buffer: ");
      Serial.println(otpBuffer);
      
      // Auto-submit when 6 digits entered
      if (otpBuffer.length() == 6) {
        delay(500);
        submitOTP();
      }
    }
    else if (key == '#') {
      // Submit OTP
      submitOTP();
    }
    else if (key == '*') {
      // Clear OTP
      clearOTP();
    }
    else if (key == 'A') {
      // Backspace - remove last digit
      if (otpBuffer.length() > 0) {
        otpBuffer.remove(otpBuffer.length() - 1);
        Serial.print("OTP Buffer: ");
        Serial.println(otpBuffer);
      }
    }
  }
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("WebSocket Disconnected");
      break;
      
    case WStype_CONNECTED:
      Serial.println("WebSocket Connected");
      // Send Socket.IO handshake
      webSocket.sendTXT("40");
      break;
      
    case WStype_TEXT:
      Serial.printf("Message: %s\n", payload);
      break;
  }
}

void sendKeypadDigit(char digit) {
  // Send Socket.IO event: keypad-input
  String message = "42[\"keypad-input\",{\"digit\":\"" + String(digit) + "\"}]";
  webSocket.sendTXT(message);
  Serial.println("Sent digit to website");
}

void clearOTP() {
  otpBuffer = "";
  // Send Socket.IO event: keypad-clear
  webSocket.sendTXT("42[\"keypad-clear\",{}]");
  Serial.println("OTP cleared");
}

void submitOTP() {
  if (otpBuffer.length() > 0) {
    // Send Socket.IO event: keypad-submit
    String message = "42[\"keypad-submit\",{\"otp\":\"" + otpBuffer + "\"}]";
    webSocket.sendTXT(message);
    Serial.println("OTP submitted: " + otpBuffer);
    
    // Clear buffer after submit
    delay(1000);
    otpBuffer = "";
  }
}
