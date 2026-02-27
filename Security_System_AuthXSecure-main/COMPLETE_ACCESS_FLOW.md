# Complete Access Control Flow

## 🎯 Two-Step Verification System

The system requires BOTH verifications before unlocking the door:

1. **OTP Verification** ✓
2. **Face Recognition** ✓
3. **Door Unlock** 🚪 (Servo Motor)

---

## 📋 Complete Flow

### Step 1: OTP Verification

**Input Methods:**
- Manual entry in OTP field
- Hardware keypad (auto-fills OTP field)
- Keypad simulator (for testing)

**OTP Groups:**
- FAMILY: `123456` (Permanent)
- SERVANT: `567890` (Permanent)
- FRIEND: `999999` (Permanent)
- TEMP: Admin-generated (5 min expiry)

**Process:**
1. User enters 6-digit OTP
2. System checks against all groups
3. If valid → Proceed to Step 2
4. If invalid → Access denied

---

### Step 2: Face Recognition

**Process:**
1. Camera activates automatically after OTP verification
2. System detects face using BlazeFace model
3. Captures face image
4. Verifies face confidence (>50% required)
5. If valid → Proceed to Step 3
6. If invalid → Access denied

---

### Step 3: Door Unlock (Servo Motor)

**Process:**
1. Server sends POST request to ESP32
2. ESP32 receives unlock command at `/unlock` endpoint
3. `handleUnlock()` function called
4. `openDoor()` function executes:
   - Servo rotates to 90° (door open)
   - Waits 3 seconds
   - Servo returns to 0° (door closed)
5. Success response sent back to server

---

## 🔧 ESP32 Configuration

### Required Endpoints

```cpp
server.on("/verify", handleVerify);           // OTP verification
server.on("/generateOTP", handleGenerateOTP); // Admin OTP generation
server.on("/unlock", HTTP_POST, handleUnlock); // Door unlock command
```

### Unlock Handler

```cpp
void handleUnlock() {
  Serial.println("Unlock request received from server");
  openDoor();
  server.send(200, "application/json", 
    "{\"status\":\"unlocked\",\"message\":\"Door opened successfully\"}");
  Serial.println("Door unlocked via web command");
}
```

### Door Control Function

```cpp
void openDoor() {
  doorServo.write(90);  // Open position
  delay(3000);          // Keep open for 3 seconds
  doorServo.write(0);   // Close position
}
```

---

## 🌐 Server Configuration

### Environment Variables (.env)

```
PORT=3000
JWT_SECRET=smart_home_secret_key_2024
ESP32_IP=192.168.1.100
```

**Important:** Update `ESP32_IP` to match your ESP32's actual IP address!

### Find ESP32 IP Address

After uploading code to ESP32:
1. Open Serial Monitor (115200 baud)
2. Look for: `ESP IP: 192.168.1.xxx`
3. Update `.env` file with this IP

---

## 🧪 Testing Guide

### Test Without Hardware (Simulation Mode)

1. **Start Server**
   ```
   npm start
   ```

2. **Login**
   - Go to http://localhost:3000
   - Login as admin: `admin@smarthome.com` / `Admin@123`

3. **Test OTP**
   - Enter: `123456` (FAMILY)
   - Click "Verify OTP"
   - Should show: "OTP Verified! Starting facial recognition..."

4. **Test Face Recognition**
   - Allow camera access
   - Position face in front of camera
   - System captures and verifies face

5. **Check Door Unlock**
   - Console shows: "Sending unlock command to ESP32..."
   - Server logs: "ESP32 not reachable, simulating unlock"
   - Alert: "Door unlocked successfully"

### Test With Hardware (Full System)

1. **Setup ESP32**
   - Upload `esp32/door_control.ino`
   - Connect servo to pin 18
   - Connect buzzer to pin 16
   - Power on ESP32

2. **Configure Network**
   - Update WiFi credentials in ESP32 code
   - Note ESP32 IP from Serial Monitor
   - Update `.env` file with ESP32 IP

3. **Test Complete Flow**
   - Enter OTP (123456, 567890, or 999999)
   - Complete face recognition
   - Watch servo motor move!

---

## 📊 System Architecture

```
┌─────────────────┐
│   User Input    │
│  (OTP Entry)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ OTP Verification│
│  (Group Check)  │
└────────┬────────┘
         │ ✓ Valid
         ▼
┌─────────────────┐
│ Face Recognition│
│  (Camera + ML)  │
└────────┬────────┘
         │ ✓ Valid
         ▼
┌─────────────────┐
│  Server sends   │
│ POST /unlock to │
│     ESP32       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ESP32 receives │
│ handleUnlock()  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   openDoor()    │
│ Servo: 0° → 90° │
│   Wait 3 sec    │
│ Servo: 90° → 0° │
└─────────────────┘
```

---

## 🔍 Debugging

### Check Server Logs

```
Attempting to unlock door via ESP32 at 192.168.1.100
ESP32 response: {status: "unlocked", message: "Door opened successfully"}
✓ Door unlocked successfully
```

### Check ESP32 Serial Monitor

```
Unlock request received from server
Opening door...
Door closed
Door unlocked via web command
```

### Check Browser Console (F12)

```
OTP verified for group: FAMILY
Starting camera for facial recognition...
Face detected! Confidence: 95.2%
Sending unlock command to ESP32...
✓ Door unlocked successfully
```

---

## ⚙️ Configuration Checklist

- [ ] ESP32 code uploaded
- [ ] Servo connected to pin 18
- [ ] Buzzer connected to pin 16
- [ ] WiFi credentials updated
- [ ] ESP32 IP noted from Serial Monitor
- [ ] `.env` file updated with ESP32 IP
- [ ] Server running on port 3000
- [ ] Both devices on same network

---

## 🚨 Troubleshooting

### Door Doesn't Unlock

**Check 1: ESP32 Connection**
- Ping ESP32: `ping 192.168.1.100`
- Check ESP32 is powered on
- Verify WiFi connection

**Check 2: Network**
- ESP32 and server on same network?
- Firewall blocking port 80?
- Correct IP in `.env` file?

**Check 3: Servo**
- Servo connected to pin 18?
- Servo has power supply?
- Test servo with simple sketch

### Simulation Mode

If ESP32 not available:
- System works in simulation mode
- All verifications complete
- Door unlock simulated
- Message: "ESP32 simulation mode"

---

## 📱 Access Summary

**Admin:**
- Generate OTPs for all groups
- View group OTP list
- Full system access

**Regular User:**
- Enter OTP (received from admin)
- Complete face verification
- Access granted if both pass

**Visitor (Hardware Keypad):**
- Receive OTP from admin
- Enter on physical keypad
- OTP auto-fills on website
- Complete face verification
- Door unlocks automatically

---

## ✅ Success Indicators

1. **OTP Verified:** ✓ Green checkmark
2. **Face Recognized:** ✓ Confidence >50%
3. **Door Unlocked:** ✓ Servo moves
4. **Access Logged:** ✓ Visitor log updated

---

**System Status:** ✅ Ready
**Server:** http://localhost:3000
**ESP32 IP:** Update in `.env` file
