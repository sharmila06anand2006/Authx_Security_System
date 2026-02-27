#include <WiFi.h>
#include <WebServer.h>
#include <ESP32Servo.h>

#define DOORSERVO 18
#define BUZZER 16

const char* ssid = "Keerthi";
const char* password = "Madhumitha";

WebServer server(80);
Servo doorServo;

// -------- GROUP OTPs --------
String FAMILY_OTP  = "123456";
String SERVANT_OTP = "567890";
String FRIEND_OTP  = "999999";
String TEMP_OTP    = "";   // For admin-generated OTP
unsigned long TEMP_OTP_EXPIRY = 0;  // Expiry time in milliseconds
const unsigned long OTP_VALIDITY = 300000;  // 5 minutes validity

// -------- FUNCTION: Open Door --------
void openDoor() {
  Serial.println("Opening door...");
  doorServo.write(90);  // Open position (90 degrees)
  delay(5000);          // Keep open for 5 seconds
  doorServo.write(0);   // Close position (0 degrees)
  Serial.println("Door closed");
}

// -------- FUNCTION: Deny --------
void denyAccess() {
  digitalWrite(BUZZER, HIGH);
  delay(2000);
  digitalWrite(BUZZER, LOW);
}

// -------- VERIFY OTP --------
void handleVerify() {
  if (!server.hasArg("group") || !server.hasArg("otp")) {
    server.send(400, "text/plain", "Missing Parameters");
    return;
  }

  String group = server.arg("group");
  String otp   = server.arg("otp");
  bool valid = false;

  if (group == "FAMILY" && otp == FAMILY_OTP)
    valid = true;
  else if (group == "SERVANT" && otp == SERVANT_OTP)
    valid = true;
  else if (group == "FRIEND" && otp == FRIEND_OTP)
    valid = true;
  else if (group == "TEMP" && otp == TEMP_OTP && TEMP_OTP != "") {
    // Check if OTP is expired
    if (millis() < TEMP_OTP_EXPIRY) {
      valid = true;
      // Clear OTP after one-time use
      TEMP_OTP = "";
      TEMP_OTP_EXPIRY = 0;
    } else {
      // OTP expired
      TEMP_OTP = "";
      TEMP_OTP_EXPIRY = 0;
      server.send(403, "text/plain", "OTP_EXPIRED");
      return;
    }
  }

  if (valid) {
    openDoor();
    server.send(200, "text/plain", "ACCESS_GRANTED");
  } else {
    denyAccess();
    server.send(403, "text/plain", "ACCESS_DENIED");
  }
}

// -------- ADMIN GENERATE TEMP OTP --------
void handleGenerateOTP() {
  if (!server.hasArg("adminKey")) {
    server.send(400, "text/plain", "Missing Admin Key");
    return;
  }

  String adminKey = server.arg("adminKey");

  // Simple admin password
  if (adminKey == "ADMIN123") {
    // Generate new random OTP
    TEMP_OTP = String(random(1000, 9999));
    // Set expiry time (current time + validity period)
    TEMP_OTP_EXPIRY = millis() + OTP_VALIDITY;
    
    String response = "TEMP_OTP:" + TEMP_OTP + "|VALID_FOR:5min";
    server.send(200, "text/plain", response);
  } else {
    server.send(403, "text/plain", "Invalid Admin Key");
  }
}

// -------- UNLOCK DOOR (After OTP + Face Verification) --------
void handleUnlock() {
  Serial.println("Unlock request received from server");
  
  // Open the door
  openDoor();
  
  // Send success response
  server.send(200, "application/json", "{\"status\":\"unlocked\",\"message\":\"Door opened successfully\"}");
  
  Serial.println("Door unlocked via web command");
}

void setup() {
  Serial.begin(115200);
  
  doorServo.attach(DOORSERVO);
  doorServo.write(0);
  
  pinMode(BUZZER, OUTPUT);
  
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
  
  Serial.print("ESP IP: ");
  Serial.println(WiFi.localIP());
  
  server.on("/verify", handleVerify);
  server.on("/generateOTP", handleGenerateOTP);
  server.on("/unlock", HTTP_POST, handleUnlock);
  
  server.begin();
}

void loop() {
  server.handleClient();
}
