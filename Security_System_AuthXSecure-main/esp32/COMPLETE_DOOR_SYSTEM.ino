/*
 * COMPLETE SMART DOOR CONTROL SYSTEM
 * For ESP32 with Servo Motor and Buzzer
 * 
 * Hardware Connections:
 * - Servo Signal → GPIO 18
 * - Servo VCC → External 5V Power Supply
 * - Servo GND → Common Ground (ESP32 GND + Power GND)
 * - Buzzer (+) → GPIO 16
 * - Buzzer (-) → GND
 * 
 * Features:
 * - Group-based OTP verification (FAMILY, SERVANT, FRIEND, TEMP)
 * - Web server for remote control
 * - Serial commands for testing
 * - Automatic door open/close with servo
 * - Buzzer for access denial
 */

#include <WiFi.h>
#include <WebServer.h>
#include <ESP32Servo.h>

// ========== PIN DEFINITIONS ==========
#define SERVO_PIN 18
#define BUZZER_PIN 16

// ========== WIFI CREDENTIALS ==========
const char* ssid = "Keerthi";          // Change to your WiFi name
const char* password = "Madhumitha";   // Change to your WiFi password

// ========== OBJECTS ==========
WebServer server(80);
Servo doorServo;

// ========== GROUP OTPs ==========
String FAMILY_OTP  = "123456";   // Permanent OTP for family
String SERVANT_OTP = "567890";   // Permanent OTP for servant
String FRIEND_OTP  = "999999";   // Permanent OTP for friend
String TEMP_OTP    = "";         // Temporary OTP (admin-generated)

// ========== OTP EXPIRY ==========
unsigned long TEMP_OTP_EXPIRY = 0;
const unsigned long OTP_VALIDITY = 300000;  // 5 minutes in milliseconds

// ========== SERVO POSITIONS ==========
const int SERVO_CLOSED = 0;      // Door closed position
const int SERVO_OPEN = 90;       // Door open position
const int DOOR_OPEN_TIME = 5000; // Keep door open for 5 seconds

// ========================================
// FUNCTION: Open Door
// ========================================
void openDoor() {
  Serial.println("\n>>> OPENING DOOR <<<");
  Serial.println("Moving servo to 90 degrees...");
  
  doorServo.write(SERVO_OPEN);
  Serial.println("✓ Door OPEN");
  
  Serial.print("Waiting ");
  Serial.print(DOOR_OPEN_TIME / 1000);
  Serial.println(" seconds...");
  delay(DOOR_OPEN_TIME);
  
  Serial.println("Closing door...");
  doorServo.write(SERVO_CLOSED);
  Serial.println("✓ Door CLOSED\n");
}

// ========================================
// FUNCTION: Deny Access (Buzzer Alert)
// ========================================
void denyAccess() {
  Serial.println("\n>>> ACCESS DENIED <<<");
  Serial.println("Activating buzzer...");
  
  digitalWrite(BUZZER_PIN, HIGH);
  delay(2000);
  digitalWrite(BUZZER_PIN, LOW);
  
  Serial.println("✓ Buzzer alert complete\n");
}

// ========================================
// WEB HANDLER: Verify OTP
// ========================================
void handleVerify() {
  Serial.println("\n--- OTP Verification Request ---");
  
  if (!server.hasArg("group") || !server.hasArg("otp")) {
    Serial.println("ERROR: Missing parameters");
    server.send(400, "text/plain", "Missing Parameters");
    return;
  }

  String group = server.arg("group");
  String otp = server.arg("otp");
  bool valid = false;

  Serial.print("Group: ");
  Serial.println(group);
  Serial.print("OTP: ");
  Serial.println(otp);

  // Check against all group OTPs
  if (group == "FAMILY" && otp == FAMILY_OTP) {
    valid = true;
    Serial.println("✓ FAMILY OTP matched");
  }
  else if (group == "SERVANT" && otp == SERVANT_OTP) {
    valid = true;
    Serial.println("✓ SERVANT OTP matched");
  }
  else if (group == "FRIEND" && otp == FRIEND_OTP) {
    valid = true;
    Serial.println("✓ FRIEND OTP matched");
  }
  else if (group == "TEMP" && otp == TEMP_OTP && TEMP_OTP != "") {
    // Check if TEMP OTP is expired
    if (millis() < TEMP_OTP_EXPIRY) {
      valid = true;
      Serial.println("✓ TEMP OTP matched");
      
      // Clear TEMP OTP after use (one-time use)
      TEMP_OTP = "";
      TEMP_OTP_EXPIRY = 0;
      Serial.println("TEMP OTP cleared (one-time use)");
    } else {
      Serial.println("✗ TEMP OTP expired");
      TEMP_OTP = "";
      TEMP_OTP_EXPIRY = 0;
      server.send(403, "text/plain", "OTP_EXPIRED");
      return;
    }
  }

  if (valid) {
    Serial.println("ACCESS GRANTED");
    openDoor();
    server.send(200, "text/plain", "ACCESS_GRANTED");
  } else {
    Serial.println("ACCESS DENIED - Invalid OTP");
    denyAccess();
    server.send(403, "text/plain", "ACCESS_DENIED");
  }
}

// ========================================
// WEB HANDLER: Generate Temporary OTP
// ========================================
void handleGenerateOTP() {
  Serial.println("\n--- Generate OTP Request ---");
  
  if (!server.hasArg("adminKey")) {
    Serial.println("ERROR: Missing admin key");
    server.send(400, "text/plain", "Missing Admin Key");
    return;
  }

  String adminKey = server.arg("adminKey");

  if (adminKey == "ADMIN123") {
    // Generate random 4-digit OTP
    TEMP_OTP = String(random(1000, 9999));
    TEMP_OTP_EXPIRY = millis() + OTP_VALIDITY;
    
    Serial.print("✓ Generated TEMP OTP: ");
    Serial.println(TEMP_OTP);
    Serial.println("Valid for 5 minutes");
    
    String response = "TEMP_OTP:" + TEMP_OTP + "|VALID_FOR:5min";
    server.send(200, "text/plain", response);
  } else {
    Serial.println("✗ Invalid admin key");
    server.send(403, "text/plain", "Invalid Admin Key");
  }
}

// ========================================
// WEB HANDLER: Unlock Door (Direct)
// ========================================
void handleUnlock() {
  Serial.println("\n--- Direct Unlock Request ---");
  Serial.println("Source: Web server command");
  
  openDoor();
  
  server.send(200, "application/json", 
    "{\"status\":\"unlocked\",\"message\":\"Door opened successfully\"}");
  
  Serial.println("✓ Unlock command completed");
}

// ========================================
// WEB HANDLER: Status Check
// ========================================
void handleStatus() {
  int servoPos = doorServo.read();
  String status = (servoPos > 45) ? "open" : "closed";
  
  String json = "{\"status\":\"" + status + "\",";
  json += "\"servo_position\":" + String(servoPos) + ",";
  json += "\"wifi_connected\":true,";
  json += "\"ip\":\"" + WiFi.localIP().toString() + "\"}";
  
  server.send(200, "application/json", json);
  
  Serial.println("\n--- Status Request ---");
  Serial.print("Door Status: ");
  Serial.println(status);
  Serial.print("Servo Position: ");
  Serial.println(servoPos);
}

// ========================================
// SERIAL COMMAND HANDLER
// ========================================
void handleSerialCommands() {
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    command.toUpperCase();
    
    Serial.println("\n>>> Serial Command: " + command);
    
    if (command == "OPEN") {
      Serial.println("Manual door open command");
      openDoor();
    }
    else if (command == "CLOSE") {
      Serial.println("Manual door close command");
      doorServo.write(SERVO_CLOSED);
      Serial.println("✓ Door closed");
    }
    else if (command == "TEST") {
      Serial.println("Running servo test...");
      testServo();
    }
    else if (command == "BUZZER") {
      Serial.println("Testing buzzer...");
      denyAccess();
    }
    else if (command == "STATUS") {
      printStatus();
    }
    else if (command == "HELP") {
      printHelp();
    }
    else {
      Serial.println("Unknown command. Type HELP for commands.");
    }
  }
}

// ========================================
// TEST SERVO MOVEMENT
// ========================================
void testServo() {
  Serial.println("\n=== SERVO TEST ===");
  
  Serial.println("Position 0°...");
  doorServo.write(0);
  delay(2000);
  
  Serial.println("Position 45°...");
  doorServo.write(45);
  delay(2000);
  
  Serial.println("Position 90°...");
  doorServo.write(90);
  delay(2000);
  
  Serial.println("Position 180°...");
  doorServo.write(180);
  delay(2000);
  
  Serial.println("Back to 0°...");
  doorServo.write(0);
  delay(1000);
  
  Serial.println("✓ Servo test complete\n");
}

// ========================================
// PRINT STATUS
// ========================================
void printStatus() {
  Serial.println("\n========== SYSTEM STATUS ==========");
  Serial.print("WiFi: ");
  Serial.println(WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  Serial.print("Servo Position: ");
  Serial.println(doorServo.read());
  Serial.print("FAMILY OTP: ");
  Serial.println(FAMILY_OTP);
  Serial.print("SERVANT OTP: ");
  Serial.println(SERVANT_OTP);
  Serial.print("FRIEND OTP: ");
  Serial.println(FRIEND_OTP);
  Serial.print("TEMP OTP: ");
  Serial.println(TEMP_OTP == "" ? "Not generated" : TEMP_OTP);
  Serial.println("===================================\n");
}

// ========================================
// PRINT HELP
// ========================================
void printHelp() {
  Serial.println("\n========== SERIAL COMMANDS ==========");
  Serial.println("OPEN    - Open the door");
  Serial.println("CLOSE   - Close the door");
  Serial.println("TEST    - Test servo movement");
  Serial.println("BUZZER  - Test buzzer");
  Serial.println("STATUS  - Show system status");
  Serial.println("HELP    - Show this help");
  Serial.println("=====================================\n");
}

// ========================================
// SETUP
// ========================================
void setup() {
  // Initialize Serial
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n\n");
  Serial.println("========================================");
  Serial.println("   SMART DOOR CONTROL SYSTEM");
  Serial.println("========================================\n");
  
  // Initialize Servo
  Serial.println("Initializing servo...");
  doorServo.attach(SERVO_PIN);
  doorServo.write(SERVO_CLOSED);
  Serial.println("✓ Servo attached to GPIO 18");
  Serial.println("✓ Door set to closed position (0°)\n");
  
  // Initialize Buzzer
  Serial.println("Initializing buzzer...");
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  Serial.println("✓ Buzzer ready on GPIO 16\n");
  
  // Connect to WiFi
  Serial.println("Connecting to WiFi...");
  Serial.print("SSID: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.println();
  } else {
    Serial.println("\n✗ WiFi Connection Failed");
    Serial.println("System will work with Serial commands only\n");
  }
  
  // Setup Web Server Routes
  server.on("/verify", handleVerify);
  server.on("/generateOTP", handleGenerateOTP);
  server.on("/unlock", HTTP_POST, handleUnlock);
  server.on("/status", HTTP_GET, handleStatus);
  
  server.begin();
  Serial.println("✓ Web server started\n");
  
  // Print OTP Information
  Serial.println("========== GROUP OTPs ==========");
  Serial.print("FAMILY:  ");
  Serial.println(FAMILY_OTP);
  Serial.print("SERVANT: ");
  Serial.println(SERVANT_OTP);
  Serial.print("FRIEND:  ");
  Serial.println(FRIEND_OTP);
  Serial.println("TEMP:    (Admin generates)");
  Serial.println("================================\n");
  
  // Print Help
  printHelp();
  
  Serial.println("System ready! Waiting for commands...\n");
}

// ========================================
// MAIN LOOP
// ========================================
void loop() {
  // Handle web server requests
  server.handleClient();
  
  // Handle serial commands
  handleSerialCommands();
  
  // Small delay to prevent watchdog issues
  delay(10);
}
