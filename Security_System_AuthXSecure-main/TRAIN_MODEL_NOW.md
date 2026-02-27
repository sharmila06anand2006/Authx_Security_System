# 🎯 Quick Start: Train Your Face Model

Hi Keerthi! Follow these simple steps to train your face recognition model:

## Step 1: Start the Server
```bash
node server.js
```

## Step 2: Login
1. Open: http://localhost:3000
2. Email: 230589.ec@rmkec.ac.in
3. Password: (your password)
4. Click "Sign In"

## Step 3: Train Your Face
1. Go to: http://localhost:3000/face-registration.html
2. Click "📷 Start Camera"
3. Allow camera access
4. Position your face in the circle
5. Click "✓ Capture Face Samples"
6. Wait while 10 samples are captured
7. Click "💾 Save Registration"

## Step 4: Test It!
1. Go back to home page
2. Click "Door Access"
3. Select group: FAMILY
4. Enter OTP: 123456
5. Click "Verify OTP"
6. Face recognition starts automatically
7. If your face matches → Door unlocks! ✅

## That's It!
Your face is now trained and ready to unlock the door!

---

**What Was Implemented:**

✅ Face registration page with camera capture
✅ 10 face samples captured automatically
✅ Face data stored in database
✅ Face verification against registered samples
✅ Integration with OTP + Face verification flow
✅ Door unlock after successful verification
✅ Confidence scoring and match counting
✅ Security: Only registered faces can unlock

**Files Created/Updated:**
- `public/face-registration.html` - Face registration UI
- `routes/user.js` - Face registration & verification endpoints
- `db/storage.js` - Face data storage methods
- `public/ml-models.js` - Face verification logic
- `public/app.js` - Updated door unlock flow
- `db/data/face_data.json` - Face data storage

**How It Works:**
1. You register your face (10 samples)
2. When accessing door, you enter OTP
3. Camera starts and detects your face
4. System compares your face to registered samples
5. If 2+ samples match with >60% confidence → Access granted
6. ESP32 receives unlock command
7. Servo motor opens door for 5 seconds

**Ready to go!** 🚀
