const express = require('express');
const router = express.Router();
const axios = require('axios');
const storage = require('../db/storage');
const { CATEGORIES, CATEGORY_PERMISSIONS } = require('../models/Category');

// Group-based OTP system (matching ESP32 implementation)
const GROUP_OTPS = {
  FAMILY: "123456",
  SERVANT: "567890",
  FRIEND: "999999",
  TEMP: null  // Admin-generated temporary OTP
};

let tempOTPExpiry = null;

// Generate OTP - Admin can generate temporary OTP or use group OTPs
router.post('/generate-otp', (req, res) => {
  const { group } = req.body;
  
  // If group specified, return that group's OTP
  if (group && GROUP_OTPS[group] && group !== 'TEMP') {
    return res.json({ 
      message: `${group} OTP retrieved`, 
      otp: GROUP_OTPS[group],
      group: group,
      type: 'permanent'
    });
  }
  
  // Generate temporary OTP (default behavior)
  GROUP_OTPS.TEMP = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
  tempOTPExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes
  
  console.log('Generated TEMP OTP:', GROUP_OTPS.TEMP);
  
  res.json({ 
    message: 'Temporary OTP generated', 
    otp: GROUP_OTPS.TEMP,
    group: 'TEMP',
    type: 'temporary',
    expiresIn: 300 // seconds
  });
});

// Get all group OTPs (admin only)
router.get('/group-otps', (req, res) => {
  res.json({
    groups: {
      FAMILY: { otp: GROUP_OTPS.FAMILY, type: 'permanent' },
      SERVANT: { otp: GROUP_OTPS.SERVANT, type: 'permanent' },
      FRIEND: { otp: GROUP_OTPS.FRIEND, type: 'permanent' },
      TEMP: { 
        otp: GROUP_OTPS.TEMP, 
        type: 'temporary',
        expiresAt: tempOTPExpiry,
        active: GROUP_OTPS.TEMP && Date.now() < tempOTPExpiry
      }
    }
  });
});

// Verify OTP - Check against all group OTPs
router.post('/verify-otp', (req, res) => {
  const { otp, group } = req.body;
  
  if (!otp) {
    return res.status(400).json({ 
      message: 'OTP is required',
      verified: false 
    });
  }
  
  let matchedGroup = null;
  let isValid = false;
  
  // Check against all groups
  if (otp === GROUP_OTPS.FAMILY) {
    matchedGroup = 'FAMILY';
    isValid = true;
  } else if (otp === GROUP_OTPS.SERVANT) {
    matchedGroup = 'SERVANT';
    isValid = true;
  } else if (otp === GROUP_OTPS.FRIEND) {
    matchedGroup = 'FRIEND';
    isValid = true;
  } else if (otp === GROUP_OTPS.TEMP && GROUP_OTPS.TEMP !== null) {
    // Check TEMP OTP expiry
    if (Date.now() > tempOTPExpiry) {
      GROUP_OTPS.TEMP = null;
      return res.status(400).json({ 
        message: 'Temporary OTP expired. Please generate a new one.',
        verified: false 
      });
    }
    matchedGroup = 'TEMP';
    isValid = true;
    
    // Clear TEMP OTP after use (one-time use)
    GROUP_OTPS.TEMP = null;
    tempOTPExpiry = null;
  }
  
  if (isValid) {
    console.log(`OTP verified for group: ${matchedGroup}`);
    res.json({ 
      message: `Access granted for ${matchedGroup} group!`, 
      verified: true,
      group: matchedGroup,
      proceedToFaceRecognition: true
    });
  } else {
    res.status(400).json({ 
      message: 'Invalid OTP. Please try again.',
      verified: false 
    });
  }
});

// Generate OTP with phone (for advanced features)
router.post('/generate-otp-phone', (req, res) => {
  const { phone, category } = req.body;
  
  if (!phone || !category) {
    return res.status(400).json({ message: 'Phone and category required' });
  }
  
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  
  storage.storeOTP(phone, otp, category, expiresAt);
  
  res.json({ 
    message: 'OTP generated', 
    otp, // In production, send via SMS/WhatsApp
    expiresIn: 300 // seconds
  });
});

// Request OTP for unknown users (requires admin approval)
router.post('/request-otp', (req, res) => {
  const { phone, name, purpose } = req.body;
  
  if (!phone) {
    return res.status(400).json({ message: 'Phone number required' });
  }
  
  const request = storage.storePendingRequest({
    phone,
    name: name || 'Unknown',
    purpose: purpose || 'Visit',
    category: CATEGORIES.GUEST
  });
  
  res.json({
    message: 'Access request sent to admin',
    requestId: request.id,
    status: 'pending'
  });
});

// Admin: Get pending requests
router.get('/pending-requests', (req, res) => {
  const requests = storage.getPendingRequests();
  res.json(requests);
});

// Admin: Approve request and generate OTP
router.post('/approve-request', (req, res) => {
  const { requestId } = req.body;
  
  const request = storage.updateRequestStatus(requestId, 'approved');
  
  if (!request) {
    return res.status(404).json({ message: 'Request not found' });
  }
  
  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes for guests
  
  storage.storeOTP(request.phone, otp, request.category, expiresAt);
  storage.updateRequestStatus(requestId, 'approved', otp);
  
  res.json({
    message: 'Request approved',
    otp, // Send via WhatsApp in production
    phone: request.phone
  });
});

// Admin: Reject request
router.post('/reject-request', (req, res) => {
  const { requestId } = req.body;
  
  const request = storage.updateRequestStatus(requestId, 'rejected');
  
  if (!request) {
    return res.status(404).json({ message: 'Request not found' });
  }
  
  res.json({ message: 'Request rejected' });
});

// Verify OTP with phone (for advanced features)
router.post('/verify-otp-phone', (req, res) => {
  const { phone, otp } = req.body;
  
  const storedOTP = storage.getOTP(phone);
  
  if (!storedOTP) {
    return res.status(400).json({ message: 'No OTP found for this phone' });
  }
  
  if (storedOTP.used) {
    return res.status(400).json({ message: 'OTP already used' });
  }
  
  if (Date.now() > storedOTP.expiresAt) {
    return res.status(400).json({ message: 'OTP expired' });
  }
  
  if (otp === storedOTP.otp) {
    storage.markOTPUsed(phone);
    res.json({ 
      message: 'OTP verified', 
      verified: true,
      category: storedOTP.category,
      proceedToFaceRecognition: true
    });
  } else {
    res.status(400).json({ message: 'Invalid OTP', verified: false });
  }
});

// Unlock door (send command to ESP32)
router.post('/unlock', async (req, res) => {
  try {
    const esp32Ip = process.env.ESP32_IP || '192.168.1.100'; // Default IP
    
    console.log(`Attempting to unlock door via ESP32 at ${esp32Ip}`);
    
    try {
      // Send unlock command to ESP32
      const response = await axios.post(`http://${esp32Ip}/unlock`, 
        { duration: 5000 },
        { timeout: 5000 }
      );
      
      console.log('ESP32 response:', response.data);
      res.json({ 
        message: 'Door unlocked successfully',
        esp32Response: response.data,
        success: true
      });
    } catch (esp32Error) {
      // ESP32 not reachable - simulate unlock for testing
      console.warn('ESP32 not reachable, simulating unlock:', esp32Error.message);
      
      res.json({ 
        message: 'Door unlock command sent (ESP32 simulation mode)',
        success: true,
        simulated: true,
        note: 'Connect ESP32 for actual door control'
      });
    }
  } catch (error) {
    console.error('Door unlock error:', error);
    res.status(500).json({ 
      message: 'Failed to unlock door', 
      error: error.message,
      success: false
    });
  }
});

// Facial recognition verification
router.post('/verify-face', async (req, res) => {
  try {
    const { imageData, personId, phone, category } = req.body;
    
    // In production, integrate with facial recognition API
    // For now, simulate verification
    const isValid = true; // Replace with actual facial recognition logic
    
    res.json({
      message: 'Face verification complete',
      isValid,
      personId,
      phone,
      category
    });
  } catch (error) {
    res.status(500).json({ message: 'Face verification failed', error: error.message });
  }
});

// Identify person by face using 128D embeddings (if available)
router.post('/identify-face-v2', async (req, res) => {
  try {
    const { faceDescriptor } = req.body;
    
    if (!faceDescriptor || faceDescriptor.length !== 128) {
      return res.status(400).json({ message: '128D face descriptor required' });
    }
    
    console.log('🔍 Attempting to identify person by 128D face embedding...');
    
    // Get all users
    const users = storage.readUsers();
    
    // Get all face data
    const allFaceData = storage.readFaceData();
    
    let bestMatch = null;
    let bestDistance = Infinity;
    const threshold = 0.6; // FaceAPI.js recommended threshold
    
    // Check each user's registered face
    for (const user of users) {
      if (!user.faceId) continue;
      
      const faceData = allFaceData[user.faceId];
      if (!faceData || faceData.version !== 'faceapi-128d') continue;
      
      console.log(`   Checking against ${user.nickname || user.email}...`);
      
      // Compare against all samples
      for (const sample of faceData.samples) {
        const distance = euclideanDistance128D(faceDescriptor, sample.descriptor);
        
        if (distance < bestDistance) {
          bestDistance = distance;
          bestMatch = {
            user: {
              id: user.id,
              email: user.email,
              nickname: user.nickname,
              language: user.language
            },
            distance: distance,
            similarity: 1 - Math.min(distance, 1)
          };
        }
      }
    }
    
    if (bestMatch && bestDistance < threshold) {
      console.log(`✅ Person identified: ${bestMatch.user.nickname} (distance: ${bestDistance.toFixed(4)}, similarity: ${(bestMatch.similarity * 100).toFixed(1)}%)`);
      
      // Log access
      storage.logAccess({
        userId: bestMatch.user.id,
        userName: bestMatch.user.nickname,
        method: 'face_recognition_128d',
        confidence: bestMatch.similarity,
        accessGranted: true
      });
      
      res.json({
        identified: true,
        user: bestMatch.user,
        confidence: bestMatch.similarity,
        distance: bestDistance,
        method: '128d-euclidean',
        message: `Welcome ${bestMatch.user.nickname}!`
      });
    } else {
      console.log(`❌ No match found. Best distance: ${bestDistance.toFixed(4)} (Required: < ${threshold})`);
      
      // Log failed attempt
      storage.logAccess({
        userId: null,
        userName: 'Unknown',
        method: 'face_recognition_128d',
        confidence: bestMatch ? bestMatch.similarity : 0,
        accessGranted: false
      });
      
      res.json({
        identified: false,
        confidence: bestMatch ? bestMatch.similarity : 0,
        distance: bestDistance,
        method: '128d-euclidean',
        message: 'Face not recognized - distance above threshold'
      });
    }
    
  } catch (error) {
    console.error('Face identification error:', error);
    res.status(500).json({ message: 'Face identification failed', error: error.message });
  }
});

function euclideanDistance128D(desc1, desc2) {
  if (!desc1 || !desc2 || desc1.length !== 128 || desc2.length !== 128) {
    return 1.0;
  }
  
  let sum = 0;
  for (let i = 0; i < 128; i++) {
    const diff = desc1[i] - desc2[i];
    sum += diff * diff;
  }
  
  return Math.sqrt(sum);
}

// Identify person by face (legacy method)
router.post('/identify-face', async (req, res) => {
  try {
    const { faceLandmarks, faceImage } = req.body;
    
    if (!faceLandmarks) {
      return res.status(400).json({ message: 'Face landmarks required' });
    }
    
    console.log('🔍 Attempting to identify person by face...');
    
    // Get all users
    const users = storage.readUsers();
    
    // Get all face data
    const allFaceData = storage.readFaceData();
    
    let bestMatch = null;
    let bestConfidence = 0;
    const threshold = 0.70; // 70% similarity required for authentication
    
    // Check each user's registered face
    for (const user of users) {
      if (!user.faceId) continue;
      
      const faceData = allFaceData[user.faceId];
      if (!faceData) continue;
      
      console.log(`   Checking against ${user.nickname || user.email}...`);
      
      // Compare against all samples
      for (const sample of faceData.samples) {
        const similarity = compareFaceLandmarks(faceLandmarks, sample.landmarks);
        
        if (similarity > bestConfidence) {
          bestConfidence = similarity;
          bestMatch = {
            user: {
              id: user.id,
              email: user.email,
              nickname: user.nickname,
              language: user.language
            },
            confidence: similarity
          };
        }
      }
    }
    
    if (bestMatch && bestConfidence >= threshold) {
      console.log(`✅ Person identified: ${bestMatch.user.nickname} (${(bestConfidence * 100).toFixed(1)}%)`);
      
      // Log access
      storage.logAccess({
        userId: bestMatch.user.id,
        userName: bestMatch.user.nickname,
        method: 'face_recognition',
        confidence: bestConfidence,
        accessGranted: true
      });
      
      res.json({
        identified: true,
        user: bestMatch.user,
        confidence: bestConfidence,
        message: `Welcome ${bestMatch.user.nickname}!`
      });
    } else {
      console.log(`❌ No match found. Best confidence: ${(bestConfidence * 100).toFixed(1)}% (Required: 70%+)`);
      
      // Log failed attempt
      storage.logAccess({
        userId: null,
        userName: 'Unknown',
        method: 'face_recognition',
        confidence: bestConfidence,
        accessGranted: false
      });
      
      res.json({
        identified: false,
        confidence: bestConfidence,
        message: 'Face not recognized - similarity below 70% threshold'
      });
    }
    
  } catch (error) {
    console.error('Face identification error:', error);
    res.status(500).json({ message: 'Face identification failed', error: error.message });
  }
});

// Optimized ML Face Recognition - Same algorithms as user.js

function normalizeLandmarks(landmarks) {
  if (!landmarks || landmarks.length === 0) return null;
  
  const xs = landmarks.map(p => p[0]);
  const ys = landmarks.map(p => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  const width = maxX - minX;
  const height = maxY - minY;
  
  if (width === 0 || height === 0) return null;
  
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const scale = Math.max(width, height);
  
  return landmarks.map(p => [
    (p[0] - centerX) / scale,
    (p[1] - centerY) / scale
  ]);
}

function calculateFaceDescriptor(landmarks) {
  if (!landmarks || landmarks.length === 0) return null;
  
  const normalized = normalizeLandmarks(landmarks);
  if (!normalized) return null;
  
  const features = [];
  const n = normalized.length;
  
  // Pairwise distances
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = normalized[i][0] - normalized[j][0];
      const dy = normalized[i][1] - normalized[j][1];
      features.push(Math.sqrt(dx * dx + dy * dy));
    }
  }
  
  // Angles
  for (let i = 0; i < n - 2; i++) {
    const p1 = normalized[i];
    const p2 = normalized[i + 1];
    const p3 = normalized[i + 2];
    
    const v1x = p1[0] - p2[0];
    const v1y = p1[1] - p2[1];
    const v2x = p3[0] - p2[0];
    const v2y = p3[1] - p2[1];
    
    const angle = Math.atan2(v2y, v2x) - Math.atan2(v1y, v1x);
    features.push(Math.cos(angle));
    features.push(Math.sin(angle));
  }
  
  // Centroid features
  const centroidX = normalized.reduce((sum, p) => sum + p[0], 0) / n;
  const centroidY = normalized.reduce((sum, p) => sum + p[1], 0) / n;
  
  for (let i = 0; i < n; i++) {
    const dx = normalized[i][0] - centroidX;
    const dy = normalized[i][1] - centroidY;
    features.push(Math.sqrt(dx * dx + dy * dy));
  }
  
  // Variance
  const varX = normalized.reduce((sum, p) => sum + Math.pow(p[0] - centroidX, 2), 0) / n;
  const varY = normalized.reduce((sum, p) => sum + Math.pow(p[1] - centroidY, 2), 0) / n;
  features.push(Math.sqrt(varX));
  features.push(Math.sqrt(varY));
  
  return features;
}

function compareFaceDescriptors(desc1, desc2) {
  if (!desc1 || !desc2) return 0;
  
  const len = Math.min(desc1.length, desc2.length);
  
  // Pearson correlation
  let sum1 = 0, sum2 = 0, sum1Sq = 0, sum2Sq = 0, pSum = 0;
  
  for (let i = 0; i < len; i++) {
    sum1 += desc1[i];
    sum2 += desc2[i];
    sum1Sq += desc1[i] * desc1[i];
    sum2Sq += desc2[i] * desc2[i];
    pSum += desc1[i] * desc2[i];
  }
  
  const num = pSum - (sum1 * sum2 / len);
  const den = Math.sqrt((sum1Sq - sum1 * sum1 / len) * (sum2Sq - sum2 * sum2 / len));
  const correlation = den === 0 ? 0 : num / den;
  const correlationSim = (correlation + 1) / 2;
  
  // Cosine similarity
  let dotProduct = 0, mag1 = 0, mag2 = 0;
  for (let i = 0; i < len; i++) {
    dotProduct += desc1[i] * desc2[i];
    mag1 += desc1[i] * desc1[i];
    mag2 += desc2[i] * desc2[i];
  }
  
  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);
  const cosineSim = (mag1 === 0 || mag2 === 0) ? 0 : (dotProduct / (mag1 * mag2) + 1) / 2;
  
  // Euclidean
  let sumDiff = 0;
  for (let i = 0; i < len; i++) {
    sumDiff += Math.pow(desc1[i] - desc2[i], 2);
  }
  const euclideanDist = Math.sqrt(sumDiff / len);
  const euclideanSim = Math.max(0, 1 - euclideanDist);
  
  return (correlationSim * 0.4) + (cosineSim * 0.4) + (euclideanSim * 0.2);
}

// Helper function to compare face landmarks (optimized)
function compareFaceLandmarks(landmarks1, landmarks2) {
  if (!landmarks1 || !landmarks2) return 0;
  
  // Method 1: Procrustes analysis
  const norm1 = normalizeLandmarks(landmarks1);
  const norm2 = normalizeLandmarks(landmarks2);
  
  if (!norm1 || !norm2) return 0;
  
  const n = Math.min(norm1.length, norm2.length);
  
  let sumXX = 0, sumYY = 0, sumXY = 0, sumYX = 0;
  
  for (let i = 0; i < n; i++) {
    sumXX += norm1[i][0] * norm2[i][0];
    sumYY += norm1[i][1] * norm2[i][1];
    sumXY += norm1[i][0] * norm2[i][1];
    sumYX += norm1[i][1] * norm2[i][0];
  }
  
  const theta = Math.atan2(sumYX - sumXY, sumXX + sumYY);
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  
  let totalDist = 0;
  for (let i = 0; i < n; i++) {
    const rotX = norm2[i][0] * cos - norm2[i][1] * sin;
    const rotY = norm2[i][0] * sin + norm2[i][1] * cos;
    
    const dx = norm1[i][0] - rotX;
    const dy = norm1[i][1] - rotY;
    totalDist += Math.sqrt(dx * dx + dy * dy);
  }
  
  const euclideanSim = Math.max(0, 1 - (totalDist / n * 5));
  
  // Method 2: Descriptor-based
  const desc1 = calculateFaceDescriptor(landmarks1);
  const desc2 = calculateFaceDescriptor(landmarks2);
  const descriptorSim = compareFaceDescriptors(desc1, desc2);
  
  // Method 3: Hausdorff
  let hausdorffDist = 0;
  for (let i = 0; i < n; i++) {
    let minDist = Infinity;
    for (let j = 0; j < n; j++) {
      const dx = norm1[i][0] - norm2[j][0];
      const dy = norm1[i][1] - norm2[j][1];
      minDist = Math.min(minDist, Math.sqrt(dx * dx + dy * dy));
    }
    hausdorffDist += minDist;
  }
  const hausdorffSim = Math.max(0, 1 - (hausdorffDist / n * 6));
  
  // Optimized weighted combination
  return (euclideanSim * 0.20) + (descriptorSim * 0.60) + (hausdorffSim * 0.20);
}

module.exports = router;
