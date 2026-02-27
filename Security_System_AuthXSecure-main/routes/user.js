const express = require('express');
const router = express.Router();
const storage = require('../db/storage');
const jwt = require('jsonwebtoken');

// Middleware to verify token
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = storage.findUserById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { nickname, language, voiceProfile, faceId } = req.body;
    
    const user = storage.updateUser(req.userId, {
      nickname,
      language,
      voiceProfile,
      faceId
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const { password, ...userWithoutPassword } = user;
    res.json({ message: 'Profile updated', user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Register face samples with FaceAPI.js 128D embeddings
router.post('/register-face-v2', authMiddleware, async (req, res) => {
  try {
    const { userId, faceSamples } = req.body;
    
    // Verify user owns this account or is admin
    if (req.userId !== userId) {
      const user = storage.findUserById(req.userId);
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }
    
    // Validate face samples
    if (!faceSamples || !Array.isArray(faceSamples) || faceSamples.length < 15) {
      return res.status(400).json({ message: 'At least 15 face samples required' });
    }
    
    // Validate that samples have 128D descriptors
    for (const sample of faceSamples) {
      if (!sample.descriptor || sample.descriptor.length !== 128) {
        return res.status(400).json({ message: 'Invalid face descriptor format. Expected 128D vector.' });
      }
    }
    
    // Generate face ID
    const faceId = `FACE_${userId}_${Date.now()}`;
    
    // Store face samples with 128D embeddings
    const faceData = {
      faceId,
      userId,
      samples: faceSamples,
      registeredAt: new Date().toISOString(),
      sampleCount: faceSamples.length,
      version: 'faceapi-128d'
    };
    
    storage.saveFaceData(faceId, faceData);
    
    // Update user with face ID
    storage.updateUser(userId, { faceId });
    
    console.log(`✅ Face registered with FaceAPI.js for user ${userId}: ${faceSamples.length} samples with 128D embeddings`);
    
    res.json({ 
      message: 'Face registered successfully with 128D embeddings',
      faceId,
      sampleCount: faceSamples.length,
      version: 'faceapi-128d'
    });
    
  } catch (error) {
    console.error('Face registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify face using 128D embeddings (Euclidean distance)
router.post('/verify-face-v2', authMiddleware, async (req, res) => {
  try {
    const { userId, faceDescriptor } = req.body;
    
    if (!userId || !faceDescriptor || faceDescriptor.length !== 128) {
      return res.status(400).json({ message: 'Missing or invalid 128D face descriptor' });
    }
    
    const user = storage.findUserById(userId);
    if (!user || !user.faceId) {
      return res.status(404).json({ message: 'No face registered for this user' });
    }
    
    const faceData = storage.getFaceData(user.faceId);
    if (!faceData) {
      return res.status(404).json({ message: 'Face data not found' });
    }
    
    console.log(`\n🔍 Verifying 128D face embedding for user: ${user.nickname || user.email}`);
    console.log(`   Registered samples: ${faceData.samples.length}`);
    console.log(`   Model version: ${faceData.version || 'legacy'}`);
    
    // Calculate Euclidean distances for all samples
    const distances = [];
    const threshold = 0.6; // FaceAPI.js recommended threshold for 128D embeddings
    
    for (let i = 0; i < faceData.samples.length; i++) {
      const sample = faceData.samples[i];
      const distance = euclideanDistance(faceDescriptor, sample.descriptor);
      
      distances.push({
        index: i,
        distance: distance,
        similarity: 1 - Math.min(distance, 1) // Convert distance to similarity
      });
      
      console.log(`   Sample ${i + 1}: Distance=${distance.toFixed(4)}, Similarity=${((1 - Math.min(distance, 1)) * 100).toFixed(1)}%`);
    }
    
    // Find best match
    const minDistance = Math.min(...distances.map(d => d.distance));
    const maxSimilarity = 1 - Math.min(minDistance, 1);
    const matchCount = distances.filter(d => d.distance < threshold).length;
    
    // Calculate statistics
    const avgDistance = distances.reduce((sum, d) => sum + d.distance, 0) / distances.length;
    const avgSimilarity = 1 - Math.min(avgDistance, 1);
    
    // Verification logic: distance < 0.6 and at least 8 matches (40% of 20 samples)
    const MINIMUM_MATCHES = 8;
    const verified = minDistance < threshold && matchCount >= MINIMUM_MATCHES;
    
    console.log(`   Min distance: ${minDistance.toFixed(4)} (threshold: ${threshold})`);
    console.log(`   Max similarity: ${(maxSimilarity * 100).toFixed(1)}%`);
    console.log(`   Avg similarity: ${(avgSimilarity * 100).toFixed(1)}%`);
    console.log(`   Matches below threshold: ${matchCount}/${faceData.samples.length}`);
    console.log(`   Verified: ${verified ? '✅ YES' : '❌ NO - Not authenticated'}\n`);
    
    res.json({
      verified,
      confidence: maxSimilarity,
      avgConfidence: avgSimilarity,
      distance: minDistance,
      matchCount,
      totalSamples: faceData.samples.length,
      threshold,
      method: '128d-euclidean'
    });
    
  } catch (error) {
    console.error('Face verification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function: Euclidean distance for 128D vectors
function euclideanDistance(desc1, desc2) {
  if (!desc1 || !desc2 || desc1.length !== 128 || desc2.length !== 128) {
    return 1.0; // Maximum distance
  }
  
  let sum = 0;
  for (let i = 0; i < 128; i++) {
    const diff = desc1[i] - desc2[i];
    sum += diff * diff;
  }
  
  return Math.sqrt(sum);
}

// Register face samples
router.post('/register-face', authMiddleware, async (req, res) => {
  try {
    const { userId, faceSamples } = req.body;
    
    // Verify user owns this account or is admin
    if (req.userId !== userId) {
      const user = storage.findUserById(req.userId);
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }
    
    // Validate face samples
    if (!faceSamples || !Array.isArray(faceSamples) || faceSamples.length < 5) {
      return res.status(400).json({ message: 'At least 5 face samples required' });
    }
    
    // Generate face ID
    const faceId = `FACE_${userId}_${Date.now()}`;
    
    // Store face samples
    const faceData = {
      faceId,
      userId,
      samples: faceSamples,
      registeredAt: new Date().toISOString(),
      sampleCount: faceSamples.length
    };
    
    storage.saveFaceData(faceId, faceData);
    
    // Update user with face ID
    storage.updateUser(userId, { faceId });
    
    res.json({ 
      message: 'Face registered successfully',
      faceId,
      sampleCount: faceSamples.length
    });
    
  } catch (error) {
    console.error('Face registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get registered face data
router.get('/face-data/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user owns this account or is admin
    if (req.userId !== userId) {
      const user = storage.findUserById(req.userId);
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }
    
    const user = storage.findUserById(userId);
    if (!user || !user.faceId) {
      return res.status(404).json({ message: 'No face data registered' });
    }
    
    const faceData = storage.getFaceData(user.faceId);
    if (!faceData) {
      return res.status(404).json({ message: 'Face data not found' });
    }
    
    res.json(faceData);
    
  } catch (error) {
    console.error('Get face data error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify face against registered samples
router.post('/verify-face', authMiddleware, async (req, res) => {
  try {
    const { userId, faceLandmarks } = req.body;
    
    if (!userId || !faceLandmarks) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }
    
    const user = storage.findUserById(userId);
    if (!user || !user.faceId) {
      return res.status(404).json({ message: 'No face registered for this user' });
    }
    
    const faceData = storage.getFaceData(user.faceId);
    if (!faceData) {
      return res.status(404).json({ message: 'Face data not found' });
    }
    
    console.log(`\n🔍 Verifying face for user: ${user.nickname || user.email}`);
    console.log(`   Registered samples: ${faceData.samples.length}`);
    
    // Enhanced comparison with multiple algorithms
    let similarities = [];
    const threshold = 0.70; // 70% similarity required for authentication
    
    for (let i = 0; i < faceData.samples.length; i++) {
      const sample = faceData.samples[i];
      
      // Use optimized comparison methods
      const euclideanSim = compareFaceLandmarksEuclidean(faceLandmarks, sample.landmarks);
      const descriptorSim = compareFaceLandmarksCosine(faceLandmarks, sample.landmarks);
      const hausdorffSim = compareFaceLandmarksNormalized(faceLandmarks, sample.landmarks);
      
      // Optimized weighted average - favor descriptor-based method for stability
      const combinedSimilarity = (euclideanSim * 0.20) + (descriptorSim * 0.60) + (hausdorffSim * 0.20);
      
      similarities.push({
        index: i,
        euclidean: euclideanSim,
        cosine: descriptorSim,
        normalized: hausdorffSim,
        combined: combinedSimilarity
      });
      
      console.log(`   Sample ${i + 1}: Euclidean=${euclideanSim.toFixed(3)}, Cosine=${descriptorSim.toFixed(3)}, Normalized=${hausdorffSim.toFixed(3)}, Combined=${combinedSimilarity.toFixed(3)}`);
    }
    
    // Find best matches
    const maxSimilarity = Math.max(...similarities.map(s => s.combined));
    const matchCount = similarities.filter(s => s.combined >= threshold).length;
    const avgSimilarity = similarities.reduce((sum, s) => sum + s.combined, 0) / similarities.length;
    
    // Strict verification: require at least 5 samples matching above 70% threshold
    const MINIMUM_MATCHES = 5;
    const verified = maxSimilarity >= threshold && matchCount >= MINIMUM_MATCHES;
    
    console.log(`   Max similarity: ${(maxSimilarity * 100).toFixed(1)}%`);
    console.log(`   Avg similarity: ${(avgSimilarity * 100).toFixed(1)}%`);
    console.log(`   Matches above threshold (70%): ${matchCount}/${faceData.samples.length}`);
    console.log(`   Required matches: ${MINIMUM_MATCHES}`);
    console.log(`   Verified: ${verified ? '✅ YES' : `❌ NO - ${matchCount < MINIMUM_MATCHES ? 'Insufficient matches (need 5+)' : 'This person is not the authenticated user'}`}\n`);
    
    res.json({
      verified,
      confidence: maxSimilarity,
      avgConfidence: avgSimilarity,
      matchCount,
      totalSamples: faceData.samples.length,
      threshold,
      details: similarities
    });
    
  } catch (error) {
    console.error('Face verification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Optimized ML Face Recognition with Advanced Algorithms

// Normalize landmarks relative to bounding box for consistent comparison
function normalizeLandmarks(landmarks) {
  if (!landmarks || landmarks.length === 0) return null;
  
  // Find bounding box
  const xs = landmarks.map(p => p[0]);
  const ys = landmarks.map(p => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  const width = maxX - minX;
  const height = maxY - minY;
  
  if (width === 0 || height === 0) return null;
  
  // Normalize to unit square and center
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const scale = Math.max(width, height);
  
  return landmarks.map(p => [
    (p[0] - centerX) / scale,
    (p[1] - centerY) / scale
  ]);
}

// Advanced face descriptor with geometric invariants
function calculateFaceDescriptor(landmarks) {
  if (!landmarks || landmarks.length === 0) return null;
  
  const normalized = normalizeLandmarks(landmarks);
  if (!normalized) return null;
  
  const features = [];
  const n = normalized.length;
  
  // 1. Pairwise distances (geometric relationships)
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = normalized[i][0] - normalized[j][0];
      const dy = normalized[i][1] - normalized[j][1];
      features.push(Math.sqrt(dx * dx + dy * dy));
    }
  }
  
  // 2. Angles between consecutive triplets (shape features)
  for (let i = 0; i < n - 2; i++) {
    const p1 = normalized[i];
    const p2 = normalized[i + 1];
    const p3 = normalized[i + 2];
    
    const v1x = p1[0] - p2[0];
    const v1y = p1[1] - p2[1];
    const v2x = p3[0] - p2[0];
    const v2y = p3[1] - p2[1];
    
    const angle = Math.atan2(v2y, v2x) - Math.atan2(v1y, v1x);
    features.push(Math.cos(angle)); // Use cosine for rotation invariance
    features.push(Math.sin(angle));
  }
  
  // 3. Centroid-based features (distribution)
  const centroidX = normalized.reduce((sum, p) => sum + p[0], 0) / n;
  const centroidY = normalized.reduce((sum, p) => sum + p[1], 0) / n;
  
  for (let i = 0; i < n; i++) {
    const dx = normalized[i][0] - centroidX;
    const dy = normalized[i][1] - centroidY;
    features.push(Math.sqrt(dx * dx + dy * dy));
  }
  
  // 4. Variance and moments (statistical features)
  const varX = normalized.reduce((sum, p) => sum + Math.pow(p[0] - centroidX, 2), 0) / n;
  const varY = normalized.reduce((sum, p) => sum + Math.pow(p[1] - centroidY, 2), 0) / n;
  features.push(Math.sqrt(varX));
  features.push(Math.sqrt(varY));
  
  return features;
}

// Optimized descriptor comparison using multiple metrics
function compareFaceDescriptors(desc1, desc2) {
  if (!desc1 || !desc2) return 0;
  
  const len = Math.min(desc1.length, desc2.length);
  
  // 1. Pearson correlation coefficient
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
  
  // 2. Cosine similarity
  let dotProduct = 0, mag1 = 0, mag2 = 0;
  for (let i = 0; i < len; i++) {
    dotProduct += desc1[i] * desc2[i];
    mag1 += desc1[i] * desc1[i];
    mag2 += desc2[i] * desc2[i];
  }
  
  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);
  const cosineSim = (mag1 === 0 || mag2 === 0) ? 0 : (dotProduct / (mag1 * mag2) + 1) / 2;
  
  // 3. Normalized Euclidean distance
  let sumDiff = 0;
  for (let i = 0; i < len; i++) {
    sumDiff += Math.pow(desc1[i] - desc2[i], 2);
  }
  const euclideanDist = Math.sqrt(sumDiff / len);
  const euclideanSim = Math.max(0, 1 - euclideanDist);
  
  // Weighted combination of metrics
  return (correlationSim * 0.4) + (cosineSim * 0.4) + (euclideanSim * 0.2);
}

// Method 1: Procrustes analysis (optimal alignment)
function compareFaceLandmarksEuclidean(landmarks1, landmarks2) {
  if (!landmarks1 || !landmarks2) return 0;
  
  const norm1 = normalizeLandmarks(landmarks1);
  const norm2 = normalizeLandmarks(landmarks2);
  
  if (!norm1 || !norm2) return 0;
  
  const n = Math.min(norm1.length, norm2.length);
  
  // Calculate optimal rotation using Procrustes analysis
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
  
  // Apply rotation and calculate distance
  let totalDist = 0;
  for (let i = 0; i < n; i++) {
    const rotX = norm2[i][0] * cos - norm2[i][1] * sin;
    const rotY = norm2[i][0] * sin + norm2[i][1] * cos;
    
    const dx = norm1[i][0] - rotX;
    const dy = norm1[i][1] - rotY;
    totalDist += Math.sqrt(dx * dx + dy * dy);
  }
  
  const avgDist = totalDist / n;
  return Math.max(0, 1 - (avgDist * 5));
}

// Method 2: Advanced descriptor-based comparison
function compareFaceLandmarksCosine(landmarks1, landmarks2) {
  if (!landmarks1 || !landmarks2) return 0;
  
  // Use optimized face descriptors
  const desc1 = calculateFaceDescriptor(landmarks1);
  const desc2 = calculateFaceDescriptor(landmarks2);
  
  if (!desc1 || !desc2) return 0;
  
  return compareFaceDescriptors(desc1, desc2);
}

// Method 3: Hausdorff distance (robust to outliers)
function compareFaceLandmarksNormalized(landmarks1, landmarks2) {
  if (!landmarks1 || !landmarks2) return 0;
  
  const norm1 = normalizeLandmarks(landmarks1);
  const norm2 = normalizeLandmarks(landmarks2);
  
  if (!norm1 || !norm2) return 0;
  
  const n = Math.min(norm1.length, norm2.length);
  
  // Modified Hausdorff distance (average of closest points)
  let totalDist = 0;
  
  for (let i = 0; i < n; i++) {
    let minDist = Infinity;
    
    for (let j = 0; j < n; j++) {
      const dx = norm1[i][0] - norm2[j][0];
      const dy = norm1[i][1] - norm2[j][1];
      const dist = Math.sqrt(dx * dx + dy * dy);
      minDist = Math.min(minDist, dist);
    }
    
    totalDist += minDist;
  }
  
  const avgDist = totalDist / n;
  return Math.max(0, 1 - (avgDist * 6));
}

// Legacy function for backward compatibility
function compareFaceLandmarks(landmarks1, landmarks2) {
  return compareFaceLandmarksEuclidean(landmarks1, landmarks2);
}

module.exports = router;
