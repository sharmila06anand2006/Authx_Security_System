# Face Recognition System - User Guide

## ✅ WORKING SYSTEM (BlazeFace - Simple & Reliable)

Your system has TWO face recognition implementations:

### 1. **OLD SYSTEM (WORKING)** - BlazeFace with 6-point landmarks
- **Registration Page**: http://localhost:3000/face-registration.html
- **Door Access Page**: http://localhost:3000/door-access.html
- **Features**:
  - Uses webcam to capture 15-20 photos
  - Simple 6-point facial landmarks
  - Fast and reliable
  - Works well with good lighting

### 2. **NEW SYSTEM (COMPLEX)** - FaceAPI.js with 128D embeddings
- **Registration Page**: http://localhost:3000/face-registration-v2.html
- **Door Access Page**: http://localhost:3000/door-access-v2.html
- **Upload Page**: http://localhost:3000/face-upload.html
- **Features**:
  - Professional-grade 128D face embeddings
  - Requires uploading 15-20 photos
  - More accurate but more complex
  - Requires good quality photos

---

## 🎯 RECOMMENDED: Use the OLD SYSTEM

**To register Sharmila's face using the OLD SYSTEM:**

1. **Open**: http://localhost:3000/face-registration.html

2. **Login** with Sharmila's account:
   - Email: sharmilaanand0612@gmail.com
   - Password: [your password]

3. **Click "Start Registration"**
   - Allow camera access
   - Follow on-screen instructions
   - Capture 15-20 photos with different poses

4. **Test face recognition**:
   - Go to: http://localhost:3000/door-access.html
   - Click "Start Recognition"
   - Show your face to camera
   - Should recognize you!

---

## 🔧 Current Issue

You were trying to use the NEW SYSTEM (v2) which requires:
- Uploading 15-20 photos from your computer
- Processing them with FaceAPI.js
- More complex setup

**Solution**: Use the OLD SYSTEM instead - it's simpler and works directly with your webcam!

---

## 📝 System Files

**OLD SYSTEM:**
- Frontend: `public/face-registration.html`, `public/door-access.html`
- Backend: `routes/user.js` → `/register-face` endpoint
- Uses: BlazeFace model, 6-point landmarks

**NEW SYSTEM:**
- Frontend: `public/face-registration-v2.html`, `public/door-access-v2.html`, `public/face-upload.html`
- Backend: `routes/user.js` → `/register-face-v2` endpoint
- Uses: FaceAPI.js, 128D face descriptors

---

## ✅ Next Steps

1. Go to: http://localhost:3000/face-registration.html
2. Register Sharmila's face using webcam
3. Test at: http://localhost:3000/door-access.html

That's it! Much simpler than the v2 system.
