# Smart Home Automation - Quick Start Guide

## 🚀 What's New

### ✅ Logout Functionality
- Logout button added to dashboard navbar
- Clears session and returns to login screen
- Stops all active services (voice chat, socket connections)

### ✅ Fixed Admin Credentials
- **Email:** admin@smarthome.com
- **Password:** Admin@123
- Admin account is automatically created on server startup
- Cannot be changed through UI (security feature)

### ✅ Hardware Keypad Integration
- Real-time OTP input from physical keypad
- Digits appear instantly on website
- Auto-submit when 6 digits entered
- WebSocket-based communication

## 📋 Server Status

**Current Status:** ✅ Running on port 3000

**Access URLs:**
- Main Application: http://localhost:3000
- Keypad Simulator: http://localhost:3000/keypad-test.html
- Admin Dashboard: http://localhost:3000/admin.html

## 🔐 Login Credentials

### Admin Account
```
Email: admin@smarthome.com
Password: Admin@123
```

### Regular Users
Create new accounts through the signup form on the main page.

## 🎮 Testing the System

### 1. Test Web Interface
1. Open http://localhost:3000
2. Login with admin credentials or create new account
3. Test OTP generation and verification
4. Test voice chat features

### 2. Test Keypad Simulator
1. Open http://localhost:3000/keypad-test.html in a new tab
2. Keep the main page open in another tab
3. Press numbers on the simulator
4. Watch the OTP field update in real-time on the main page

### 3. Test Hardware Keypad (if available)
1. Upload `esp32/keypad_3x4.ino` to ESP32
2. Update WiFi credentials and server IP in the code
3. Connect 3x4 matrix keypad to ESP32
4. Press keys and watch website update

## 🔧 Hardware Setup

### ESP32 Door Control
**File:** `esp32/door_control.ino`
- Controls servo motor (door lock)
- Buzzer for access denial
- OTP verification with expiration
- WiFi-enabled

**Features:**
- Group OTPs (FAMILY, SERVANT, FRIEND)
- Admin-generated temporary OTPs (5-minute expiry)
- One-time use OTPs
- Automatic expiration

### ESP32 Keypad Integration
**File:** `esp32/keypad_3x4.ino`
- 3x4 matrix keypad support
- Real-time WebSocket communication
- Auto-submit after 6 digits
- Clear and submit functions

**Keypad Layout:**
```
1  2  3
4  5  6
7  8  9
*  0  #

* = Clear
# = Submit
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user
- `POST /api/auth/signin` - Login
- `POST /api/auth/check-phone` - Check if phone is registered

### Door Control
- `POST /api/door/generate-otp` - Generate OTP
- `POST /api/door/verify-otp` - Verify OTP
- `POST /api/door/unlock` - Unlock door
- `POST /api/door/verify-face` - Facial recognition

### Access Management
- `POST /api/access/qr-scan` - QR code access
- `POST /api/access/verify-otp` - Verify access OTP
- `GET /api/access/logs` - Get access logs

### Admin
- `GET /api/door/pending-requests` - Get pending approvals
- `POST /api/door/approve-request` - Approve access request
- `POST /api/door/reject-request` - Reject access request

## 🔌 WebSocket Events

### Client → Server
- `keypad-input` - Send digit from keypad
- `keypad-clear` - Clear OTP input
- `keypad-submit` - Submit OTP
- `voice-emotion` - Voice emotion data

### Server → Client
- `keypad-digit` - Receive digit from keypad
- `keypad-cleared` - OTP cleared notification
- `keypad-submitted` - OTP submitted notification
- `emotion-detected` - Emotion detection result

## 🛠️ Troubleshooting

### Server Won't Start
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Kill the process if needed
taskkill /PID <process_id> /F

# Restart server
npm start
```

### Keypad Not Working
1. Check WebSocket connection in browser console
2. Verify server is running
3. Check firewall settings
4. Ensure both devices on same network

### Admin Login Not Working
- Use exact credentials: admin@smarthome.com / Admin@123
- Check server logs for admin account initialization
- Restart server if needed

### OTP Not Appearing
1. Open browser console (F12)
2. Check for Socket.IO connection errors
3. Verify keypad simulator is connected
4. Check server logs

## 📁 Project Structure

```
smart-home-automation/
├── esp32/
│   ├── door_control.ino          # Door control with OTP
│   ├── keypad_3x4.ino            # Keypad integration
│   └── keypad_integration.ino    # Alternative 4x4 keypad
├── public/
│   ├── index.html                # Main application
│   ├── admin.html                # Admin dashboard
│   ├── keypad-test.html          # Keypad simulator
│   ├── app.js                    # Main application logic
│   └── styles.css                # Styles
├── routes/
│   ├── auth.js                   # Authentication routes
│   ├── door.js                   # Door control routes
│   └── access.js                 # Access management routes
├── db/
│   ├── storage.js                # File-based storage
│   └── data/                     # JSON data files
├── server.js                     # Main server file
├── ADMIN_CREDENTIALS.txt         # Admin credentials
├── KEYPAD_INTEGRATION_GUIDE.md   # Detailed keypad guide
└── QUICK_START.md                # This file
```

## 🎯 Next Steps

1. **Test the web interface** - Login and explore features
2. **Try keypad simulator** - Test real-time input
3. **Setup hardware** - Upload code to ESP32
4. **Configure WiFi** - Update credentials in ESP32 code
5. **Wire keypad** - Connect matrix keypad to ESP32
6. **Test end-to-end** - Complete access flow

## 📞 Support

For detailed hardware setup, see:
- `KEYPAD_INTEGRATION_GUIDE.md` - Complete keypad setup
- `ADMIN_CREDENTIALS.txt` - Admin login info

## 🔒 Security Notes

1. Change admin password in production
2. Use HTTPS/WSS for production deployment
3. Implement rate limiting for OTP attempts
4. Enable OTP expiration (already implemented)
5. Use secure WiFi (WPA2/WPA3)
6. Keep ESP32 firmware updated

## ✨ Features Summary

- ✅ Multi-language support (English, Hindi, Tamil, Telugu)
- ✅ Voice emotion detection
- ✅ Facial recognition
- ✅ QR code access
- ✅ Hardware keypad integration
- ✅ Real-time OTP input
- ✅ Admin approval system
- ✅ Category-based access control
- ✅ Visitor logging
- ✅ Socket.IO real-time communication
- ✅ Logout functionality
- ✅ Fixed admin credentials

Enjoy your Smart Home Automation System! 🏠🔐
