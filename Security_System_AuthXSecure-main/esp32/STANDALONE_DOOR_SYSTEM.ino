/*
 * STANDALONE SMART DOOR SYSTEM
 * Test hardware independently before web integration
 * 
 * Hardware Required:
 * - ESP32 Board
 * - Servo Motor (SG90 or similar) on GPIO 18
 * - Buzzer (Active) on GPIO 16
 * - External 5V Power Supply for Servo
 * 
 * This code tests:
 * 1. Servo motor movement
 * 2. Buzzer sound
 * 3. OTP verification (via Serial Monitor)
 * 4. Complete door unlock seque