// BASIC SERVO TEST - Upload this first!
// This will help identify if servo is working at all

#include <ESP32Servo.h>

Servo myServo;

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n\n=================================");
  Serial.println("ESP32 BASIC SERVO TEST");
  Serial.println("=================================\n");
  
  Serial.println("Step 1: Attaching servo to GPIO 18...");
  myServo.attach(18);
  delay(500);
  Serial.println("✓ Servo attached\n");
  
  Serial.println("Step 2: Moving to 0 degrees...");
  myServo.write(0);
  delay(2000);
  Serial.println("✓ Should be at 0 degrees\n");
  
  Serial.println("Step 3: Moving to 90 degrees...");
  myServo.write(90);
  delay(2000);
  Serial.println("✓ Should be at 90 degrees\n");
  
  Serial.println("Step 4: Moving to 180 degrees...");
  myServo.write(180);
  delay(2000);
  Serial.println("✓ Should be at 180 degrees\n");
  
  Serial.println("Step 5: Back to 0 degrees...");
  myServo.write(0);
  delay(2000);
  Serial.println("✓ Back to 0 degrees\n");
  
  Serial.println("=================================");
  Serial.println("TEST COMPLETE");
  Serial.println("=================================\n");
  Serial.println("Did the servo move? (Check physically)");
  Serial.println("If NO: Check power supply and wiring");
  Serial.println("If YES: Servo is working!\n");
}

void loop() {
  // Continuous test - servo sweeps back and forth
  Serial.println("→ Moving to 90 degrees (OPEN)");
  myServo.write(90);
  delay(3000);
  
  Serial.println("← Moving to 0 degrees (CLOSED)");
  myServo.write(0);
  delay(3000);
  
  Serial.println("---");
}
