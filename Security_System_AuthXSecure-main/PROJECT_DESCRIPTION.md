# AuthXHome - Smart Door Access Control System

## Project Description

**AuthXHome** is an intelligent, multi-factor authentication door access control system designed for modern smart homes. The system combines facial recognition, OTP verification, and hardware integration to provide secure, contactless entry management.

---

## 🎯 Problem Statement

Traditional door locks are:
- Vulnerable to key theft or loss
- Inconvenient (carrying keys)
- Lack access tracking
- No remote control capability
- Limited user management

---

## 💡 Solution

A comprehensive smart door system that offers:
- **Contactless Access**: Face recognition for hands-free entry
- **Multiple Authentication Methods**: Face, OTP, QR code
- **Remote Management**: Web-based admin panel
- **Access Tracking**: Complete logs of all entries
- **Hardware Integration**: Physical door control via ESP32

---

## 🔑 Core Features

### 1. Facial Recognition
- Uses BlazeFace ML model for real-time face detection
- 10 training samples per user for high accuracy
- 70% similarity threshold for authentication
- Works in various lighting conditions
- Processing time: ~2 seconds

### 2. OTP System
- **Group OTPs**: Permanent codes for FAMILY, SERVANT, FRIEND
- **Temporary OTPs**: Admin-generated with 5-minute expiry
- **Keypad Entry**: Physical 4x3 keypad on ESP32
- **Web Entry**: Browser-based OTP input

### 3. Hardware Control
- **ESP32 Microcontroller**: WiFi-enabled control unit
- **Servo Motor**: Physical lock mechanism (90° rotation)
- **Auto-lock**: Door locks automatically after 5 seconds
- **Remote Commands**: Unlock via web interface

### 4. User Management
- Role-based access (Admin, Family, Guest, Servant)
- User registration and authentication
- Profile management
- Access history tracking

---

## 🏗️ Technical Architecture

### Frontend
- **HTML5/CSS3/JavaScript**: Modern web interface
- **TensorFlow.js**: Client-side ML inference
- **BlazeFace Model**: Lightweight face detection
- **Socket.io**: Real-time communication
- **Responsive Design**: Mobile and desktop support

### Backend
- **Node.js + Express**: RESTful API server
- **JWT Authentication**: Secure token-based auth
- **File-based Storage**: JSON database
- **bcrypt**: Password hashing
- **Axios**: HTTP client for ESP32 communication

### Hardware
- **ESP32 DevKit**: Main controller
- **SG90 Servo Motor**: Door lock actuator
- **4x3 Matrix Keypad**: Manual OTP entry
- **WiFi Module**: Built-in ESP32 connectivity

---

## 🔐 Security Features

1. **Password Security**
   - bcrypt hashing (10 rounds)
   - No plain text storage

2. **Token Authentication**
   - JWT with expiry
   - Secure session management

3. **OTP Security**
   - Time-limited temporary OTPs
   - One-time use for temp codes
   - Group-based permanent codes

4. **Access Control**
   - Role-based permissions
   - Admin approval for guests
   - Activity logging

5. **Face Recognition**
   - Multi-algorithm verification
   - Minimum sample requirements
   - Confidence threshold enforcement

---

## 📊 System Workflow

### Face Recognition Flow
```
1. User approaches door
2. Camera captures face
3. BlazeFace detects landmarks
4. Compare with registered samples
5. Calculate similarity score
6. If ≥70% → Grant access
7. Send unlock command to ESP32
8. Servo unlocks door for 5 seconds
9. Log access attempt
```

### OTP Flow
```
1. User enters OTP (keypad/web)
2. System validates against database
3. Check group OTPs or temp OTP
4. Verify expiry (for temp OTPs)
5. If valid → Grant access
6. Send unlock command
7. Log access attempt
```

---

## 🎨 User Interface

### Web Pages
1. **Login/Register**: User authentication
2. **Dashboard**: Main control panel
3. **Face Registration**: Capture training photos
4. **Door Access**: Real-time face recognition
5. **Admin Panel**: System management
6. **QR Access**: Quick entry option

### Design Features
- Modern purple gradient theme
- Real-time status updates
- Progress indicators
- Clear error messages
- Mobile-responsive layout

---

## 📈 Performance

### Face Recognition
- **Accuracy**: 90-95% (good lighting)
- **Speed**: 2 seconds per identification
- **False Positive**: <5%
- **Training**: 30 seconds (10 samples)

### System Response
- **OTP Verification**: <1 second
- **Door Unlock**: 5 seconds
- **Web Interface**: Real-time updates
- **ESP32 Response**: <500ms

---

## 🚀 Installation

### Software Setup
```bash
# Clone repository
git clone <repository-url>

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start server
node server.js

# Access at http://localhost:3000
```

### Hardware Setup
1. Connect servo to ESP32 Pin 18
2. Connect keypad to GPIO pins
3. Upload Arduino code to ESP32
4. Configure WiFi credentials
5. Test servo movement

---

## 👥 User Roles & Permissions

### Admin
- Full system access
- User management
- OTP generation
- View all logs
- Approve guest requests

### Family
- Face registration
- Permanent OTP access
- Profile management
- View own logs

### Guest
- Temporary access
- Time-limited permissions
- Requires admin approval

### Servant
- Scheduled access
- Specific time windows
- Activity monitoring

---

## 📱 Access Methods

### 1. Face Recognition
- Most convenient
- Hands-free
- Fast (2 seconds)
- Requires good lighting

### 2. OTP Entry
- Reliable backup
- Works in any condition
- Group-based codes
- Temporary codes for guests

### 3. QR Code
- Quick access
- Mobile-friendly
- One-time use option
- Easy sharing

---

## 🔧 Hardware Components

### Required Components
- ESP32 DevKit (1x)
- SG90 Servo Motor (1x)
- 4x3 Matrix Keypad (1x)
- Jumper Wires
- USB Cable
- Power Supply (5V)

### Optional Components
- Camera module
- LCD display
- Buzzer for feedback
- LED indicators

---

## 📊 Database Schema

### Users Collection
```json
{
  "id": "unique_id",
  "email": "user@example.com",
  "password": "hashed_password",
  "nickname": "Display Name",
  "faceId": "face_data_id",
  "category": "family|guest|servant",
  "isAdmin": false,
  "createdAt": "timestamp"
}
```

### Face Data Collection
```json
{
  "faceId": "unique_face_id",
  "userId": "user_id",
  "samples": [
    {
      "image": "base64_data",
      "landmarks": [[x1,y1], [x2,y2], ...],
      "probability": 0.95,
      "timestamp": "timestamp"
    }
  ],
  "sampleCount": 10,
  "registeredAt": "timestamp"
}
```

### Access Logs
```json
{
  "userId": "user_id",
  "userName": "User Name",
  "method": "face|otp|qr",
  "confidence": 0.94,
  "accessGranted": true,
  "timestamp": "timestamp"
}
```

---

## 🎓 Technologies Used

### Frontend Technologies
- HTML5, CSS3, JavaScript
- TensorFlow.js
- BlazeFace Model
- Socket.io Client
- Fetch API

### Backend Technologies
- Node.js
- Express.js
- JWT (jsonwebtoken)
- bcrypt
- Axios
- Socket.io

### Hardware Technologies
- Arduino IDE
- ESP32 SDK
- Servo Library
- Keypad Library
- WiFi Library

---

## 🌟 Key Achievements

✅ Real-time face recognition with 90%+ accuracy
✅ Multi-factor authentication system
✅ Hardware integration with ESP32
✅ Responsive web interface
✅ Secure access control
✅ Comprehensive logging system
✅ Admin management panel
✅ Group-based OTP system
✅ Auto-lock mechanism
✅ Remote door control

---

## 🔮 Future Enhancements

### Short Term
- Voice recognition integration
- SMS notifications
- Email alerts
- Mobile app (React Native)

### Long Term
- Cloud database (MongoDB)
- Multiple camera support
- Deep learning models
- Fingerprint integration
- Smart home ecosystem integration
- AI-powered anomaly detection

---

## 📚 Learning Outcomes

### Technical Skills Gained
- Full-stack web development
- Machine learning integration
- IoT hardware programming
- RESTful API design
- Real-time communication
- Security implementation

### Concepts Applied
- Computer vision
- Authentication systems
- Hardware interfacing
- Database design
- Web security
- User experience design

---

## 🎯 Use Cases

### Residential
- Family homes
- Apartments
- Vacation rentals
- Shared housing

### Commercial
- Office buildings
- Co-working spaces
- Retail stores
- Warehouses

### Institutional
- Schools
- Hospitals
- Government buildings
- Research facilities

---

## 📞 System Information

### Default Credentials
**Admin Account**
- Email: admin@smarthome.com
- Password: Admin@123

**Test User**
- Email: ganthimathiv2006@gmail.com
- Nickname: Keerthi

### Group OTPs
- FAMILY: 123456
- SERVANT: 567890
- FRIEND: 999999

### WiFi Configuration
- SSID: Keerthi
- Password: Madhumitha

### Server
- Port: 3000
- URL: http://localhost:3000

---

## 🐛 Troubleshooting

### Common Issues

**Face Recognition Not Working**
- Ensure good lighting
- Position face in center
- Check camera permissions
- Verify face is registered

**OTP Not Accepted**
- Check OTP expiry
- Verify correct group code
- Ensure keypad connections

**ESP32 Not Responding**
- Check WiFi connection
- Verify IP address
- Test servo manually
- Check power supply

**Server Errors**
- Restart Node.js server
- Check port availability
- Verify dependencies installed
- Review error logs

---

## 📖 Documentation

### Available Guides
- `README.md` - Quick start guide
- `HARDWARE_SETUP_GUIDE.md` - Hardware assembly
- `FACE_RECOGNITION_GUIDE.md` - Face registration
- `KEYPAD_INTEGRATION_GUIDE.md` - Keypad setup
- `GROUP_OTP_SYSTEM.md` - OTP management

---

## 🤝 Contributing

This is an educational project. Suggestions for improvements:
- Enhanced ML models
- Additional authentication methods
- Better UI/UX
- Security enhancements
- Performance optimizations

---

## 📄 License

Educational project for learning purposes.

---

## 👨‍💻 Developer

**Name**: Keerthi
**Email**: ganthimathiv2006@gmail.com
**Project**: Smart Home Door Access Control System
**Date**: February 2026

---

## 🙏 Acknowledgments

- TensorFlow.js team for ML framework
- BlazeFace model developers
- ESP32 community
- Node.js ecosystem
- Open source contributors

---

**For detailed presentation, see `PROJECT_PRESENTATION.md`**
