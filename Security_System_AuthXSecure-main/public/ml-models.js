// ML Models for Face Detection and Emotion Recognition
let faceDetectionModel = null;
let emotionModel = null;
let videoStream = null;

// Simple face database (in production, use a proper database)
let faceDatabase = {};

// Initialize ML Models
async function initializeMLModels() {
  try {
    console.log('Loading ML models...');
    
    // Load face detection model
    faceDetectionModel = await blazeface.load();
    console.log('Face detection model loaded');
    
    // Load stored faces from localStorage
    const storedFaces = localStorage.getItem('faceDatabase');
    if (storedFaces) {
      faceDatabase = JSON.parse(storedFaces);
      console.log(`Loaded ${Object.keys(faceDatabase).length} registered faces`);
    }
    
    return true;
  } catch (error) {
    console.error('Error loading ML models:', error);
    return false;
  }
}

// Save face database to localStorage
function saveFaceDatabase() {
  localStorage.setItem('faceDatabase', JSON.stringify(faceDatabase));
}

// Register a new face
function registerFace(personName, faceFeatures, faceImage) {
  const personId = `PERSON_${Date.now()}`;
  faceDatabase[personId] = {
    name: personName,
    features: faceFeatures,
    image: faceImage,
    registeredAt: new Date().toISOString()
  };
  saveFaceDatabase();
  console.log(`Registered face for ${personName} with ID ${personId}`);
  return personId;
}

// Compare two face feature sets
function compareFaces(features1, features2) {
  // Simple Euclidean distance calculation
  if (!features1 || !features2) return 0;
  
  const landmarks1 = features1.landmarks || features1.topLeft;
  const landmarks2 = features2.landmarks || features2.topLeft;
  
  if (!landmarks1 || !landmarks2) return 0;
  
  // Calculate similarity based on landmark positions
  let totalDistance = 0;
  const points = Math.min(landmarks1.length, landmarks2.length);
  
  for (let i = 0; i < points; i++) {
    const dx = landmarks1[i][0] - landmarks2[i][0];
    const dy = landmarks1[i][1] - landmarks2[i][1];
    totalDistance += Math.sqrt(dx * dx + dy * dy);
  }
  
  // Convert distance to similarity score (0-1)
  const avgDistance = totalDistance / points;
  const similarity = Math.max(0, 1 - (avgDistance / 100));
  
  return similarity;
}

// Find matching face in database
function findMatchingFace(faceFeatures, threshold = 0.6) {
  let bestMatch = null;
  let bestScore = 0;
  
  for (const [personId, data] of Object.entries(faceDatabase)) {
    const similarity = compareFaces(faceFeatures, data.features);
    
    if (similarity > bestScore && similarity >= threshold) {
      bestScore = similarity;
      bestMatch = {
        personId,
        name: data.name,
        confidence: similarity
      };
    }
  }
  
  return bestMatch;
}

// Start camera for facial recognition
async function startCamera() {
  try {
    const video = document.createElement('video');
    video.width = 640;
    video.height = 480;
    video.autoplay = true;
    
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 }
    });
    
    video.srcObject = videoStream;
    
    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        resolve(video);
      };
    });
  } catch (error) {
    console.error('Error accessing camera:', error);
    throw error;
  }
}

// Stop camera
function stopCamera() {
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }
}

// Detect faces in video frame
async function detectFaces(video) {
  if (!faceDetectionModel) {
    throw new Error('Face detection model not loaded');
  }
  
  const predictions = await faceDetectionModel.estimateFaces(video, false);
  return predictions;
}

// Capture face image
async function captureFaceImage(video) {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  
  return canvas.toDataURL('image/jpeg', 0.8);
}

// Perform facial recognition
async function performFacialRecognition() {
  try {
    console.log('Starting facial recognition...');
    
    // Get current user
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      return {
        success: false,
        message: 'Please login first'
      };
    }
    
    const userName = user.nickname || user.email;
    console.log(`👤 Verifying identity for: ${userName}`);
    
    // Show camera modal
    const modal = document.getElementById('camera-modal');
    const statusText = document.getElementById('camera-status');
    modal.classList.add('active');
    
    statusText.textContent = `Starting camera for ${userName}...`;
    
    // Start camera
    const video = await startCamera();
    const preview = document.getElementById('camera-preview');
    preview.srcObject = video.srcObject;
    
    statusText.textContent = `Detecting ${userName}'s face...`;
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for camera to stabilize
    
    // Detect faces
    const faces = await detectFaces(video);
    
    if (faces.length === 0) {
      statusText.textContent = `No face detected. ${userName}, please position your face in front of the camera.`;
      await new Promise(resolve => setTimeout(resolve, 2000));
      stopCamera();
      modal.classList.remove('active');
      return {
        success: false,
        message: 'No face detected'
      };
    }
    
    if (faces.length > 1) {
      statusText.textContent = 'Multiple faces detected. Only one person should be in frame.';
      await new Promise(resolve => setTimeout(resolve, 2000));
      stopCamera();
      modal.classList.remove('active');
      return {
        success: false,
        message: 'Multiple faces detected'
      };
    }
    
    statusText.textContent = `Face detected! Verifying ${userName}...`;
    console.log(`✓ Face detected with confidence: ${(faces[0].probability[0] * 100).toFixed(1)}%`);
    console.log(`🔍 Comparing against ${userName}'s registered samples...`);
    
    // Verify face against registered samples
    const token = localStorage.getItem('token');
    const verifyResponse = await fetch(`${API_URL}/user/verify-face`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userId: user.id,
        faceLandmarks: faces[0].landmarks
      })
    });
    
    const verifyData = await verifyResponse.json();
    
    if (verifyResponse.ok && verifyData.verified) {
      statusText.textContent = `✓ Face verified! Welcome ${userName}!`;
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log(`✅ ${userName}'s face verified successfully!`);
      console.log(`   Confidence: ${(verifyData.confidence * 100).toFixed(1)}%`);
      console.log(`   Matched samples: ${verifyData.matchCount}/10`);
    }
    
    // Stop camera
    stopCamera();
    modal.classList.remove('active');
    
    if (verifyResponse.ok && verifyData.verified) {
      console.log(`Face verified! Confidence: ${(verifyData.confidence * 100).toFixed(1)}%`);
      
      // Capture face image for logging
      const faceImage = await captureFaceImage(video);
      
      return {
        success: true,
        verified: true,
        confidence: verifyData.confidence,
        matchCount: verifyData.matchCount,
        faceImage,
        userId: user.id,
        userName: user.nickname || user.email
      };
    } else {
      console.log('Face verification failed');
      return {
        success: false,
        message: 'Face verification failed. This face does not match the registered user.',
        confidence: verifyData.confidence || 0
      };
    }
    
  } catch (error) {
    stopCamera();
    const modal = document.getElementById('camera-modal');
    modal.classList.remove('active');
    console.error('Facial recognition error:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

// Generate person ID from face features
function generatePersonId(face) {
  // Use face landmarks to create a unique ID
  const landmarks = face.landmarks || face.topLeft;
  const hash = JSON.stringify(landmarks).split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return `PERSON_${Math.abs(hash)}`;
}

// Detect emotion from voice/text
function detectEmotionFromText(text) {
  const emotions = {
    happy: ['happy', 'joy', 'great', 'awesome', 'wonderful', 'excellent', 'good', 'love', 'excited'],
    sad: ['sad', 'unhappy', 'depressed', 'down', 'upset', 'disappointed', 'terrible', 'bad'],
    angry: ['angry', 'mad', 'furious', 'annoyed', 'frustrated', 'hate'],
    excited: ['excited', 'thrilled', 'amazing', 'fantastic', 'incredible'],
    calm: ['calm', 'peaceful', 'relaxed', 'serene', 'tranquil'],
    worried: ['worried', 'anxious', 'nervous', 'concerned', 'stressed']
  };
  
  const lowerText = text.toLowerCase();
  
  for (const [emotion, keywords] of Object.entries(emotions)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return emotion;
      }
    }
  }
  
  return 'neutral';
}

// Voice recognition with emotion detection
async function startVoiceRecognition() {
  return new Promise((resolve, reject) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      reject(new Error('Speech recognition not supported'));
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const emotion = detectEmotionFromText(transcript);
      
      resolve({
        text: transcript,
        emotion: emotion,
        confidence: event.results[0][0].confidence
      });
    };
    
    recognition.onerror = (event) => {
      reject(new Error(event.error));
    };
    
    recognition.start();
  });
}

// Simulate emotion detection from facial expressions
function detectEmotionFromFace(faceData) {
  // Simplified emotion detection based on face probability
  const confidence = faceData.probability ? faceData.probability[0] : 0.5;
  
  if (confidence > 0.9) {
    return 'happy';
  } else if (confidence > 0.7) {
    return 'neutral';
  } else if (confidence > 0.5) {
    return 'calm';
  } else {
    return 'worried';
  }
}

// Combined emotion detection (face + voice)
async function detectCombinedEmotion() {
  try {
    // Try voice recognition first
    const voiceResult = await startVoiceRecognition();
    return {
      emotion: voiceResult.emotion,
      text: voiceResult.text,
      source: 'voice',
      confidence: voiceResult.confidence
    };
  } catch (error) {
    console.log('Voice recognition failed, using face detection');
    
    // Fallback to face-based emotion
    const video = await startCamera();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const faces = await detectFaces(video);
    stopCamera();
    
    if (faces.length > 0) {
      const emotion = detectEmotionFromFace(faces[0]);
      return {
        emotion: emotion,
        source: 'face',
        confidence: faces[0].probability[0]
      };
    }
    
    return {
      emotion: 'neutral',
      source: 'default',
      confidence: 0.5
    };
  }
}
