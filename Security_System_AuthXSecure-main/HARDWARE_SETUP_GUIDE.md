# Hardware Integration Troubleshooting Guide

## 🔧 Common Hardware Issues & Solutions

### Issue 1: Servo Not Moving

**Possible Causes:**
1. **Power Supply Issue**
   - Servo needs external 5V power (not from ESP32)
   - ESP32 can't provide enough current for servo
   
   **Solution:**
   - Use external 5V power supply (1A minimum)
   - Connect: Power GND → ESP32 GND (common ground)
   - Connect: Power 5V → Servo VCC
   - Connect: ESP32 Pin 18 → Servo Signal

2. **Wrong Pin Connection**
   - Servo signal wire not on GPIO 18
   
   **Solution:**
   - Verify servo signal wire is on GPIO 18
   - Check wiring: Orange/Yellow = Signal, Red = VCC, Brown/Black = GND

3. **Servo Library Issue**
   - ESP32Servo library not installed
   
   **Solution:**
   - Arduino IDE → Tools → Manage Libraries
   - Search "ESP32Servo"
   - Install "ESP32Servo by Kevin Harrington"

---

### Issue 2: Servo Moves But Not to 90 Degrees

**Possible Causes:**
1. **Servo Calibration**
   - Different servos have different ranges
   
   **Solution - Test Servo Range:**
   ```cpp
   void testServo() {
     Serial.println("Testing 0 degrees");
     doorServo.write(0);
     delay(2000);
     
     Serial.println("Testing 45 degrees");
     doorServo.write(45);
     delay(2000);
     
     Serial.println("Testing 90 degrees");
     doorServo.write(90);
     delay(2000);
     
     Serial.println("Testing 180 degrees");
     doorServo.write(180);
     delay(2000);
   }
   
   // Add to loop():
   void loop() {
     testServo();
     delay(5000);
   }
   ```

2. **Servo Type**
   - Some servos are 0-180°, others are 0-270°
   
   **Solution:**
   - Adjust angle: Try 180 instead of 90
   - Or try 45 for smaller movement

---

### Issue 3: Buzzer Not Working

**Possible Causes:**
1. **Wrong Polarity**
   - Active buzzer has polarity (+/-)
   
   **Solution:**
   - Longer leg = Positive (connect to GPIO 16)
   - Shorter leg = Negative (connect to GND)

2. **Passive vs Active Buzzer**
   - Passive buzzer needs PWM signal
   
   **Solution:**
   - Use active buzzer (simpler)
   - Or add tone() function for passive buzzer

---

### Issue 4: ESP32 Not Connecting to WiFi

**Possible Causes:**
1. **Wrong Credentials**
   
   **Solution:**
   - Double-check SSID and password
   - Check for typos, case-sensitive
   - Make sure WiFi is 2.4GHz (not 5GHz)

2. **WiFi Signal Weak**
   
   **Solution:**
   - Move ESP32 closer to router
   - Check antenna connection

---

### Issue 5: Server Can't Reach ESP32

**Possible Causes:**
1. **Different Networks**
   - ESP32 and server on different networks
   
   **Solution:**
   - Connect both to same WiFi network
   - Check ESP32 IP from Serial Monitor
   - Update .env file with correct IP

2. **Firewall Blocking**
   
   **Solution:**
   - Temporarily disable firewall
   - Or add exception for port 80

---

## 📐 Correct Wiring Diagram

### Servo Motor (SG90 or similar)
```
Servo Wire    →  Connection
Orange/Yellow →  ESP32 GPIO 18 (Signal)
Red           →  External 5V Power Supply
Brown/Black   →  GND (Common with ESP32)
```

### Buzzer (Active)
```
Buzzer Pin  →  Connection
Long Leg    →  ESP32 GPIO 16
Short Leg   →  ESP32 GND
```

### Power Supply
```
5V Power Supply:
  (+) 5V  →  Servo VCC (Red wire)
  (-) GND →  ESP32 GND + Servo GND (Common ground)

ESP32 Power:
  USB Cable or VIN pin (5-12V)
```

---

## 🧪 Step-by-Step Testing

### Test 1: Servo Only
```cpp
#include <ESP32Servo.h>

Servo testServo;

void setup() {
  Serial.begin(115200);
  testServo.attach(18);
  Serial.println("Servo test starting...");
}

void loop() {
  Serial.println("Moving to 0");
  testServo.write(0);
  delay(2000);
  
  Serial.println("Moving to 90");
  testServo.write(90);
  delay(2000);
  
  Serial.println("Moving to 180");
  testServo.write(180);
  delay(2000);
}
```

**Expected Result:**
- Servo moves smoothly between positions
- No jittering or stuttering
- Serial Monitor shows position changes

---

### Test 2: Buzzer Only
```cpp
#define BUZZER 16

void setup() {
  Serial.begin(115200);
  pinMode(BUZZER, OUTPUT);
  Serial.println("Buzzer test starting...");
}

void loop() {
  Serial.println("Buzzer ON");
  digitalWrite(BUZZER, HIGH);
  delay(1000);
  
  Serial.println("Buzzer OFF");
  digitalWrite(BUZZER, LOW);
  delay(1000);
}
```

**Expected Result:**
- Buzzer beeps every second
- Clear sound, not distorted

---

### Test 3: WiFi Connection
```cpp
#include <WiFi.h>

const char* ssid = "Keerthi";
const char* password = "Madhumitha";

void setup() {
  Serial.begin(115200);
  Serial.println("WiFi test starting...");
  
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nConnected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  Serial.print("WiFi Status: ");
  Serial.println(WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected");
  delay(5000);
}
```

**Expected Result:**
- Connects within 10 seconds
- Shows IP address (e.g., 192.168.1.105)
- Status stays "Connected"

---

## 🔍 Debugging Checklist

- [ ] ESP32 powered on (LED blinking)
- [ ] Servo connected to GPIO 18
- [ ] Servo has external 5V power
- [ ] Common ground connected
- [ ] Buzzer connected to GPIO 16
- [ ] WiFi credentials correct
- [ ] ESP32 connected to WiFi (check Serial Monitor)
- [ ] ESP32 IP noted and updated in .env
- [ ] Server and ESP32 on same network
- [ ] Serial Monitor open (115200 baud)
- [ ] ESP32Servo library installed

---

## 💡 Quick Fixes

### Servo Jittering
- Add capacitor (100µF) across servo power
- Use better power supply (2A recommended)
- Shorten servo wires

### Servo Not Reaching 90°
- Try different angles: 60, 90, 120, 180
- Check servo specifications
- Test with external servo tester

### ESP32 Keeps Resetting
- Power supply insufficient
- Use 5V 2A power supply
- Check for short circuits

### Can't Upload Code
- Press and hold BOOT button while uploading
- Check USB cable (use data cable, not charge-only)
- Select correct COM port in Arduino IDE

---

## 📞 Still Having Issues?

**Provide these details:**
1. Servo model number (e.g., SG90, MG996R)
2. Power supply voltage and current
3. Serial Monitor output
4. Photo of wiring
5. Exact error message

**Common Servo Models:**
- **SG90:** 0-180°, 5V, 100mA, works with code as-is
- **MG996R:** 0-180°, 5-7V, 500mA, needs external power
- **DS3218:** 0-270°, 5-7V, 1A, adjust angles in code

---

## ✅ Verification Steps

After fixing hardware:

1. **Upload test code** (servo only)
2. **Verify servo moves** to 0, 90, 180
3. **Upload full code** (door_control.ino)
4. **Check Serial Monitor** for IP address
5. **Update .env file** with ESP32 IP
6. **Test from website** (OTP + Face → Door unlock)

---

**Hardware integration requires patience and systematic testing!**
Test each component individually before testing the complete system.
