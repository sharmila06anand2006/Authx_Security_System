const express = require('express');
const router = express.Router();
const accessStorage = require('../db/accessStorage');
const { CATEGORIES, CATEGORY_OTP_PREFIX } = require('../models/Category');

// Generate OTP based on category
function generateOTP(category) {
  const prefix = CATEGORY_OTP_PREFIX[category] || '9';
  const randomDigits = Math.floor(10000 + Math.random() * 90000).toString();
  return prefix + randomDigits;
}

// QR Code Access - Initial entry point
router.post('/qr-scan', async (req, res) => {
  try {
    const { deviceId, timestamp } = req.body;
    
    // Create initial access request
    const accessRequest = accessStorage.createAccessRequest({
      deviceId,
      status: 'initiated',
      timestamp
    });
    
    res.json({
      success: true,
      accessRequestId: accessRequest.id,
      message: 'Please select your category and proceed'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check if user is registered (for known categories)
router.post('/check-registration', async (req, res) => {
  try {
    const { phoneNumber, category } = req.body;
    
    const user = accessStorage.findUserByPhone(phoneNumber);
    
    if (user && user.category === category) {
      // Generate OTP for registered user
      const otp = generateOTP(category);
      
      // Update or create access request
      const accessRequest = accessStorage.createAccessRequest({
        visitorName: user.name,
        phoneNumber,
        category,
        otp,
        otpGeneratedBy: 'system',
        otpGeneratedAt: new Date().toISOString(),
        status: 'otp_generated',
        isRegistered: true
      });
      
      res.json({
        success: true,
        isRegistered: true,
        accessRequestId: accessRequest.id,
        otp, // In production, send via SMS
        message: 'OTP generated. Please enter to proceed.'
      });
    } else {
      res.json({
        success: true,
        isRegistered: false,
        message: 'Not registered. Admin approval required.'
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Request admin OTP (for unregistered visitors)
router.post('/request-admin-otp', async (req, res) => {
  try {
    const { visitorName, phoneNumber, category, accessRequestId } = req.body;
    
    // Create or update access request
    let accessRequest;
    if (accessRequestId) {
      accessRequest = accessStorage.updateAccessRequest(accessRequestId, {
        visitorName,
        phoneNumber,
        category,
        status: 'pending_admin_approval'
      });
    } else {
      accessRequest = accessStorage.createAccessRequest({
        visitorName,
        phoneNumber,
        category,
        status: 'pending_admin_approval',
        isRegistered: false
      });
    }
    
    res.json({
      success: true,
      accessRequestId: accessRequest.id,
      message: 'Request sent to admin. Please wait for OTP.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin generates OTP for visitor
router.post('/admin/generate-otp', async (req, res) => {
  try {
    const { accessRequestId, adminId, approved } = req.body;
    
    if (!approved) {
      accessStorage.updateAccessRequest(accessRequestId, {
        status: 'denied',
        accessGranted: false
      });
      
      return res.json({
        success: true,
        message: 'Access denied by admin'
      });
    }
    
    const accessRequest = accessStorage.getAccessRequestById(accessRequestId);
    if (!accessRequest) {
      return res.status(404).json({ message: 'Access request not found' });
    }
    
    const otp = generateOTP(accessRequest.category);
    
    accessStorage.updateAccessRequest(accessRequestId, {
      otp,
      otpGeneratedBy: adminId,
      otpGeneratedAt: new Date().toISOString(),
      status: 'otp_generated'
    });
    
    // In production, send OTP via WhatsApp API
    
    res.json({
      success: true,
      otp, // For demo purposes
      message: 'OTP generated and sent to visitor',
      visitorPhone: accessRequest.phoneNumber
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { accessRequestId, otp } = req.body;
    
    const accessRequest = accessStorage.getAccessRequestById(accessRequestId);
    
    if (!accessRequest) {
      return res.status(404).json({ message: 'Access request not found' });
    }
    
    if (accessRequest.otp === otp) {
      accessStorage.updateAccessRequest(accessRequestId, {
        otpVerified: true,
        status: 'otp_verified'
      });
      
      res.json({
        success: true,
        verified: true,
        message: 'OTP verified. Please proceed with face recognition.',
        accessRequestId
      });
    } else {
      res.status(400).json({
        success: false,
        verified: false,
        message: 'Invalid OTP'
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify face recognition
router.post('/verify-face', async (req, res) => {
  try {
    const { accessRequestId, faceImageData } = req.body;
    
    const accessRequest = accessStorage.getAccessRequestById(accessRequestId);
    
    if (!accessRequest) {
      return res.status(404).json({ message: 'Access request not found' });
    }
    
    if (!accessRequest.otpVerified) {
      return res.status(400).json({ message: 'Please verify OTP first' });
    }
    
    // In production, verify face with ML model
    // For now, simulate face verification
    const faceVerified = true;
    
    if (faceVerified) {
      accessStorage.updateAccessRequest(accessRequestId, {
        faceVerified: true,
        faceImageUrl: faceImageData,
        accessGranted: true,
        accessTime: new Date().toISOString(),
        status: 'access_granted'
      });
      
      res.json({
        success: true,
        accessGranted: true,
        message: 'Face verified. Access granted. Door unlocking...'
      });
    } else {
      accessStorage.updateAccessRequest(accessRequestId, {
        faceVerified: false,
        status: 'face_verification_failed'
      });
      
      res.status(400).json({
        success: false,
        accessGranted: false,
        message: 'Face verification failed'
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get pending admin approvals
router.get('/admin/pending-requests', async (req, res) => {
  try {
    const pendingRequests = accessStorage.getPendingAccessRequests();
    res.json(pendingRequests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all access logs
router.get('/logs', async (req, res) => {
  try {
    const logs = accessStorage.getAllAccessRequests();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Register new user (for known categories)
router.post('/register-user', async (req, res) => {
  try {
    const { name, phoneNumber, category, faceImageData } = req.body;
    
    const existingUser = accessStorage.findUserByPhone(phoneNumber);
    if (existingUser) {
      return res.status(400).json({ message: 'User already registered' });
    }
    
    const user = accessStorage.registerUser({
      name,
      phoneNumber,
      category,
      faceImageData
    });
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
