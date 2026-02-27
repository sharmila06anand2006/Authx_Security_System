# Face Recognition Training Guide

## Overview
This guide will help you (Sharmila) train the face recognition model for secure door access.

## Prerequisites
- Your account: 230022.ec@rmkec.ac.in
- Password: (your password)
- Good lighting
- Webcam/camera access

## Step-by-Step Training Process

### 1. Start the Server
```bash
node server.js
```
Server will run on http://localhost:3000

### 2. Login to Your Account
1. Open http://localhost:3000 in your browser
2. Click "Sign In"
3. Enter your email: 230022.ec@rmkec.ac.in
4. Enter your password
5. Click "Sign In"

### 3. Register Your Face
1. After logging in, navigate to: http://localhost:3000/face-registration.html
2. Click "📷 Start Camera"
3. Allow camera access when prompted
4. Position your face in the center circle
5. Ensure good lighting
6. Click "✓ Capture Face Samples"
7. The system will automatically capture 10 samples
8. Move slightly between captures for better accuracy
9. Click "💾 Save Registration" when done

### 4. What Happens During Training
- The system captures 10 face samples
- Each sample includes:
  - Face image
  - Facial landmarks (key points on your face)
  - Detection confidence score
  - Timestamp
- All samples are stored securely in the database
- Your face ID is linked to your user account

### 5. How Face Verification Works
When you try to access the door:
1. Enter your OTP (group-based or temporary)
2. OTP is verified
3. Camera starts for face recognition
4. Your face is detected and landmarks are extracted
5. System compares your face against all 10 registered samples
6. If 2+ samples match with >60% confidence, access is granted
7. Door unlocks automatically

## Technical Details

### Face Data Storage
- Location: `db/data/face_data.json`
- Format: JSON object with face IDs as keys
- Each entry contains:
  - faceId: Unique identifier
  - userId: Your user ID
  - samples: Array of 10 face samples
  - registeredAt: Registration timestamp
  - sampleCount: Number of samples

### Verification Algorithm
- Uses facial landmark comparison
- Calculates Euclidean distance between landmarks
- Converts distance to similarity score (0-1)
- Threshold: 0.6 (60% similarity required)
- Requires at least 2 matching samples

### Security Features
- Face data is stored separately from user credentials
- Only the account owner can register their face
- Face verification requires valid OTP first
- Multiple face samples prevent spoofing
- Confidence scores logged for audit

## Testing Your Face Recognition

### Test 1: Successful Access
1. Go to http://localhost:3000
2. Login with your account
3. Go to "Door Access" section
4. Select your group (FAMILY/SERVANT/FRIEND)
5. Enter the group OTP
6. Click "Verify OTP"
7. Face recognition will start automatically
8. Position your face in front of camera
9. If verified, door unlocks

### Test 2: Failed Access (Wrong Person)
1. Have someone else try to access
2. They enter valid OTP
3. Face recognition starts
4. Their face won't match your registered samples
5. Access denied

## Troubleshooting

### Camera Not Starting
- Check browser permissions (allow camera access)
- Try a different browser (Chrome recommended)
- Ensure no other app is using the camera

### No Face Detected
- Improve lighting
- Move closer to camera
- Remove glasses/hat if wearing
- Ensure face is centered in the circle

### Low Confidence Score
- Re-register with better lighting
- Capture samples from different angles
- Ensure camera is clean and focused

### Face Not Matching
- Check if you registered face for this account
- Try re-registering with more samples
- Ensure consistent lighting conditions

## API Endpoints

### Register Face
```
POST /api/user/register-face
Headers: Authorization: Bearer <token>
Body: {
  userId: "your-user-id",
  faceSamples: [array of 10 samples]
}
```

### Verify Face
```
POST /api/user/verify-face
Headers: Authorization: Bearer <token>
Body: {
  userId: "your-user-id",
  faceLandmarks: [array of landmarks]
}
```

### Get Face Data
```
GET /api/user/face-data/:userId
Headers: Authorization: Bearer <token>
```

## Next Steps

1. Train your face model using the steps above
2. Test the complete flow: OTP → Face Recognition → Door Unlock
3. If needed, re-train with better samples
4. Add more users and train their faces

## Important Notes

- Face registration is one-time per user
- You can re-register to update your face data
- Face data is stored locally in JSON files
- For production, consider using a proper database
- Face recognition works best with consistent lighting
- System requires both OTP AND face verification for access

## Support

If you encounter issues:
1. Check browser console for errors (F12)
2. Check server logs for backend errors
3. Verify camera permissions
4. Ensure good lighting conditions
5. Try re-registering your face

---

**Ready to train your model?**
1. Start server: `node server.js`
2. Login: http://localhost:3000
3. Register face: http://localhost:3000/face-registration.html
