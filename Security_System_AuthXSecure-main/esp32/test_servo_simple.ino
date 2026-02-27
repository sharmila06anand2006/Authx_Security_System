/*
 * Simple Servo Test for ESP32
 * Tests servo movement to verify hardware connection
 */

#include <ESP32Servo.h>

#define SERVO_PIN 18

Servo testServo;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n=== ESP32 Servo Test ===");
  Serial.println("Attaching servo to pin 18...");
  
  testServo.attach(SERVO_PIN);
  testServo.write(0);  // Start at 0 degrees
  
  Serial.println("Servo attached and initialized to 0 degrees");
  Serial.println("Starting movement test...\n");
  
  delay(2000);
}

void loop() {
  // Test 0 degrees
  Serial.println("Moving to 0 degrees (closed position)");
  testServo.write(0);
  delay(3000);
  
  // Test 90 degrees
  Serial.println("Moving to 90 degrees (open position)");
  testServo.write(90);
  delay(5000);  // Stay open for 5 seconds
  
  // Back to 0
  Serial.println("Moving back to 0 degrees (closed position)");
  testServo.write(0);
  delay(3000);
  
  Serial.println("---");
  Serial.println("Test cycle complete. Repeating...\n");
  delay(2000);
}
