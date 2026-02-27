const express = require('express');
const router = express.Router();
const storage = require('../db/storage');
const { CATEGORIES, CATEGORY_OTPS } = require('../models/Category');

// Store pending OTP requests (in production, use Redis)
global.pendingOTPs = {};
global.adminGeneratedOTPs = {};

// QR Code landing page - check if user is registered
router.post('/check-user', async (req, res) => {
  try {
    const { phoneNumber, email } = req.body;
    
    // Check if user exists in any category
    const users = storage.readUsers();
    const user = users.find(u => u.phoneNumber === phoneNumber || u.email === email);
    
    if (user && user.category && user.category !== CATEGORIES.UNKNOWN) {
      // Known user - belongs to a category
      return res.json({
        isKnown: true,
        category: user.category,
        userId: user.id,
        name: user.nickname,
        requiresOTP: true
      });
    }
    
    // Unknown user - needs admin approval
    res.json({
      isKnown: false,
      requiresAdminApproval: true
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify category OTP for known users
router.post('/verify-category-otp', async (req, res) => {
  try {
    const { userId, category, otp } = req.body;
    
    // Verify OTP matches category
    if (CATEGORY_OTPS[category] === otp) {
      // OTP verified - proceed to face recognition
      res.json({
        verified: true,
        message: 'OTP verified. Please proceed to face recognition.',
        nextStep: 'face-recognition'
      });
    } else {
      res.status(400).json({
        verified: false,
        message: 'Invalid OTP for this category'
      });
    }
    
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Request admin approval for unknown visitor
router.post('/request-admin-approval', async (req, res) => {
  try {
    const { name, phoneNumber, purpose } = req.body;
    
    const requestId = `REQ_${Date.now()}`;
    
    // Store pending request
    global.pendingOTPs[requestId] = {
      name,
      phoneNumber,
      purpose,
      timestamp: new Date(),
      status: 'pending'
    };
    
    // In production, send notification to admin via WhatsApp/SMS
    console.log(`Admin approval requested for: ${name} (${phoneNumber})`);
    
    res.json({
      requestId,
      message: 'Request sent to admin. Please wait for OTP.',
      status: 'pending'
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check if admin has approved (polling endpoint)
router.get('/check-approval-status/:requestId', (req, res) => {
  try {
    const { requestId } = req.params;
    
    const request = global.pendingOTPs[requestId];
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    if (request.status === 'approved' && global.adminGeneratedOTPs[requestId]) {
      res.json({
        status: 'approved',
        otp: global.adminGeneratedOTPs[requestId],
        message: 'Admin approved. OTP sent to your phone.'
      });
    } else if (request.status === 'rejected') {
      res.json({
        status: 'rejected',
        message: 'Access denied by admin.'
      });
    } else {
      res.json({
        status: 'pending',
        message: 'Waiting for admin approval...'
      });
    }
    
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Get pending requests
router.get('/admin/pending-requests', (req, res) => {
  try {
    const pending = Object.entries(global.pendingOTPs)
      .filter(([_, req]) => req.status === 'pending')
      .map(([id, req]) => ({ requestId: id, ...req }));
    
    res.json(pending);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Approve request and generate OTP
router.post('/admin/approve-request', (req, res) => {
  try {
    const { requestId } = req.body;
    
    const request = global.pendingOTPs[requestId];
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Update request status
    request.status = 'approved';
    global.adminGeneratedOTPs[requestId] = otp;
    
    // In production, send OTP via WhatsApp to visitor's phone
    console.log(`OTP ${otp} generated for ${request.name} (${request.phoneNumber})`);
    
    res.json({
      message: 'Request approved. OTP sent to visitor.',
      otp,
      phoneNumber: request.phoneNumber
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Reject request
router.post('/admin/reject-request', (req, res) => {
  try {
    const { requestId } = req.body;
    
    const request = global.pendingOTPs[requestId];
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    request.status = 'rejected';
    
    res.json({
      message: 'Request rejected.'
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify admin-generated OTP for unknown visitors
router.post('/verify-admin-otp', (req, res) => {
  try {
    const { requestId, otp } = req.body;
    
    const storedOTP = global.adminGeneratedOTPs[requestId];
    
    if (storedOTP === otp) {
      res.json({
        verified: true,
        message: 'OTP verified. Please proceed to face recognition.',
        nextStep: 'face-recognition'
      });
    } else {
      res.status(400).json({
        verified: false,
        message: 'Invalid OTP'
      });
    }
    
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Face recognition and door unlock
router.post('/verify-face-and-unlock', async (req, res) => {
  try {
    const { userId, requestId, faceImage, category } = req.body;
    
    // In production, verify face using ML model
    const faceVerified = true; // Simulated
    
    if (faceVerified) {
      // Log visitor
      const visitorData = {
        personId: userId || requestId,
        name: userId ? storage.findUserById(userId)?.nickname : global.pendingOTPs[requestId]?.name,
        category: category || CATEGORIES.UNKNOWN,
        accessGranted: true,
        faceImage,
        timestamp: new Date()
      };
      
      storage.createVisitor(visitorData);
      
      // Unlock door
      res.json({
        success: true,
        message: 'Face verified. Door unlocked!',
        accessGranted: true
      });
      
      // Clean up
      if (requestId) {
        delete global.pendingOTPs[requestId];
        delete global.adminGeneratedOTPs[requestId];
      }
    } else {
      res.status(400).json({
        success: false,
        message: 'Face verification failed',
        accessGranted: false
      });
    }
    
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
