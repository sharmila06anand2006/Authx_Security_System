# Arduino IDE - Quick Start Guide

## 📥 Step 1: Install Required Software

### Arduino IDE
1. Download from: https://www.arduino.cc/en/software
2. Install Arduino IDE

### ESP32 Board Support
1. Open Arduino IDE
2. Go to: **File → Preferences**
3. In "Additional Board Manager URLs", add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Click OK
5. Go to: **Tools → Board → Boards Manager**
6. Search: "esp32"
7. Install: "esp32 by Espressif Systems"

### ESP32Servo Library
1. Go to: **Sketch → Include Library → Manage Libraries**
2. Search: "ESP32Servo"
3. Install: "ESP32Servo by Kevin Harrington"

---

## 🔌 Step 2: Hardware Connections

### Servo Motor
```
Servo Wire        →  Connection
Orange/Yellow     →  ESP32 GPIO 18
Red               →  External 5V Power Supply (+)
Brown/Black       →  GND (Common Ground)
```

### Buzzer
```
Buzzer Pin  →  Connection
Long Leg    →  ESP32 GPIO 16
Short Leg   →  ESP32 GND
```

### Power
```
ESP32:
  USB Cable → Computer (for programming and power)

Servo (IMPORTANT!):
  External 5V Power Supply (1-2A)
  Connect GND to ESP32 GND (common ground)
```

---

## 📤 Step 3: Upload Code

1. **Open Arduino IDE**

2. **Open the code:**
   - File → Open
   - Navigate to: `esp32/COMPLETE_DOOR_SYSTEM.ino`
   - Click Open

3. **Update WiFi Credentials** (lines 27-28):
   ```cpp
   const char* ssid = "YourWiFiName";
   const char* password = "YourWiFiPassword";
   ```

4. **Select Board:**
   - Tools → Board → ESP32 Arduino → ESP32 Dev Module

5. **Select Port:**
   - Tools → Port → COM[X] (Windows) or /dev/ttyUSB[X] (Linux/Mac)

6. **Upload:**
   - Click the Upload button (→)
   - Wait for "Done uploading"

7. **Open Serial Monitor:**
   - Tools → Serial Monitor
   - Set baud rate to: **115200**

---

## 🧪 Step 4: Test with Serial Commands

Once uploaded, you can control the door using Serial Monitor:

### Available Commands

Type these in Serial Monitor and press Enter:

```
OPEN    - Opens the door (servo to 90°, wait 5 sec, close)
CLOSE   - Closes the door immediately
TEST    - Tests servo movement (0°, 45°, 90°, 180°, 0°)
BUZZER  - Tests the buzzer
STATUS  - Shows system status (WiFi, IP, OTPs)
HELP    - Shows all commands
```

### Example Test Sequence

1. Type: `STATUS` → See system info
2. Type: `TEST` → Watch servo move through positions
3. Type: `BUZZER` → Hear buzzer beep
4. Type: `OPEN` → Door opens for 5 seconds then closes
5. Type: `CLOSE` → Door closes immediately

---

## 🌐 Step 5: Test with Web Browser

After WiFi connects, note the IP address from Serial Monitor.

### Test URLs

Replace `192.168.1.XXX` with your ESP32's IP:

**1. Check Status:**
```
http://192.168.1.XXX/status
```

**2. Unlock Door:**
```
http://192.168.1.XXX/unlock
```
(Use POST request or browser extension)

**3. Verify OTP:**
```
http://192.168.1.XXX/verify?group=FAMILY&otp=123456
```

---

## 🔐 Built-in OTPs

The system has these OTPs pre-configured:

```
FAMILY:  123456  (Permanent)
SERVANT: 567890  (Permanent)
FRIEND:  999999  (Permanent)
TEMP:    (Admin generates via web)
```

---

## 🔍 Troubleshooting

### Upload Failed
- **Hold BOOT button** while uploading
- Check USB cable (must be data cable)
- Try different USB port
- Check COM port selection

### Servo Not Moving
- **Use external 5V power supply** (most common issue!)
- Check wiring: Signal on GPIO 18
- Check common ground connection
- Try `TEST` command to see if servo responds

### WiFi Not Connecting
- Check SSID and password (case-sensitive)
- Make sure WiFi is 2.4GHz (not 5GHz)
- Move ESP32 closer to router
- Check Serial Monitor for error messages

### Serial Monitor Shows Nothing
- Check baud rate: Must be **115200**
- Check correct COM port selected
- Press RESET button on ESP32

### Buzzer Not Working
- Check polarity: Long leg to GPIO 16
- Try active buzzer (easier than passive)
- Check connection to GND

---

## 📊 Expected Serial Monitor Output

```
========================================
   SMART DOOR CONTROL SYSTEM
========================================

Initializing servo...
✓ Servo attached to GPIO 18
✓ Door set to closed position (0°)

Initializing buzzer...
✓ Buzzer ready on GPIO 16

Connecting to WiFi...
SSID: Keerthi
..........
✓ WiFi Connected!
IP Address: 192.168.1.105

✓ Web server started

========== GROUP OTPs ==========
FAMILY:  123456
SERVANT: 567890
FRIEND:  999999
TEMP:    (Admin generates)
================================

========== SERIAL COMMANDS ==========
OPEN    - Open the door
CLOSE   - Close the door
TEST    - Test servo movement
BUZZER  - Test buzzer
STATUS  - Show system status
HELP    - Show this help
=====================================

System ready! Waiting for commands...
```

---

## 🔗 Integration with Web System

Once hardware is working:

1. **Note ESP32 IP address** from Serial Monitor
2. **Update `.env` file** in your project:
   ```
   ESP32_IP=192.168.1.105
   ```
3. **Restart Node.js server**
4. **Test from website:**
   - Login to http://localhost:3000
   - Enter OTP: 123456
   - Complete face recognition
   - Door should unlock!

---

## ✅ Success Checklist

- [ ] Arduino IDE installed
- [ ] ESP32 board support installed
- [ ] ESP32Servo library installed
- [ ] Code uploaded successfully
- [ ] Serial Monitor shows system ready
- [ ] Servo moves with TEST command
- [ ] Buzzer beeps with BUZZER command
- [ ] WiFi connected (IP shown)
- [ ] OPEN command works
- [ ] Web status URL works

---

## 💡 Tips

1. **Always test with Serial commands first** before web integration
2. **Use external power for servo** - ESP32 can't provide enough current
3. **Common ground is essential** - connect all GNDs together
4. **Start simple** - test servo alone, then add buzzer, then WiFi
5. **Check Serial Monitor** - it shows detailed debug information

---

**The code is complete and ready to use!** 
Upload it to your ESP32 and start testing with Serial commands.
