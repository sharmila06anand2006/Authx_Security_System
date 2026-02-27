console.log('🚀 Smart Home App Loading...');
console.log('API URL:', 'http://localhost:3000/api');

const API_URL = 'http://localhost:3000/api';
let socket;
let currentUser = null;
let currentLanguage = 'english';
let voiceAssistant = null;

// Translations
const translations = {
  english: {
    welcome: 'Welcome to Smart Home',
    signin: 'Sign In',
    signup: 'Sign Up',
    dashboard: 'Dashboard',
    voiceChat: 'Voice Chatbot',
    emotion: 'Emotion',
    startVoice: 'Start Voice Chat',
    stopVoice: 'Stop Voice Chat',
    doorAccess: 'Door Access',
    verifyOtp: 'Verify OTP',
    generateOtp: 'Generate OTP',
    visitorLog: 'Visitor Log'
  },
  hindi: {
    welcome: 'स्मार्ट होम में आपका स्वागत है',
    signin: 'साइन इन करें',
    signup: 'साइन अप करें',
    dashboard: 'डैशबोर्ड',
    voiceChat: 'वॉयस चैटबॉट',
    emotion: 'भावना',
    startVoice: 'वॉयस चैट शुरू करें',
    stopVoice: 'वॉयस चैट बंद करें',
    doorAccess: 'दरवाजा एक्सेस',
    verifyOtp: 'OTP सत्यापित करें',
    generateOtp: 'OTP जनरेट करें',
    visitorLog: 'आगंतुक लॉग'
  },
  tamil: {
    welcome: 'ஸ்மார்ட் ஹோம் க்கு வரவேற்கிறோம்',
    signin: 'உள்நுழைக',
    signup: 'பதிவு செய்க',
    dashboard: 'டாஷ்போர்டு',
    voiceChat: 'குரல் சாட்பாட்',
    emotion: 'உணர்ச்சி',
    startVoice: 'குரல் அரட்டை தொடங்கு',
    stopVoice: 'குரல் அரட்டை நிறுத்து',
    doorAccess: 'கதவு அணுகல்',
    verifyOtp: 'OTP சரிபார்க்கவும்',
    generateOtp: 'OTP உருவாக்கு',
    visitorLog: 'பார்வையாளர் பதிவு'
  },
  telugu: {
    welcome: 'స్మార్ట్ హోమ్‌కు స్వాగతం',
    signin: 'సైన్ ఇన్',
    signup: 'సైన్ అప్',
    dashboard: 'డాష్‌బోర్డ్',
    voiceChat: 'వాయిస్ చాట్‌బాట్',
    emotion: 'భావోద్వేగం',
    startVoice: 'వాయిస్ చాట్ ప్రారంభించండి',
    stopVoice: 'వాయిస్ చాట్ ఆపండి',
    doorAccess: 'తలుపు యాక్సెస్',
    verifyOtp: 'OTP ధృవీకరించండి',
    generateOtp: 'OTP రూపొందించండి',
    visitorLog: 'సందర్శకుల లాగ్'
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ DOM Content Loaded');
  console.log('Initializing app...');
  
  initializeAuth();
  initializeDashboard();
  checkAuth();
  
  console.log('✅ App initialized');
  console.log('Ready for login!');
  
  // Initialize ML models
  initializeMLModels().then(success => {
    if (success) {
      console.log('ML models ready');
    } else {
      console.warn('ML models failed to load');
    }
  });
});

function initializeAuth() {
  console.log('📝 Initializing auth...');
  
  const languageSelect = document.getElementById('language-select');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const signinForm = document.getElementById('signin-form');
  const signupForm = document.getElementById('signup-form');
  
  console.log('Found signin form:', signinForm ? 'YES' : 'NO');
  console.log('Found signup form:', signupForm ? 'YES' : 'NO');
  
  if (!signinForm) {
    console.error('❌ Signin form not found!');
    return;
  }
  
  languageSelect.addEventListener('change', (e) => {
    currentLanguage = e.target.value;
    updateTranslations();
  });
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
      document.getElementById(`${tab}-form`).classList.add('active');
    });
  });
  
  signinForm.addEventListener('submit', handleSignIn);
  signupForm.addEventListener('submit', handleSignUp);
  
  console.log('✅ Auth initialized - form listeners attached');
}

function initializeDashboard() {
  document.getElementById('generate-otp').addEventListener('click', generateOTP);
  document.getElementById('verify-otp').addEventListener('click', verifyOTP);
  document.getElementById('start-voice').addEventListener('click', startVoiceChat);
  document.getElementById('stop-voice').addEventListener('click', stopVoiceChat);
  document.getElementById('profile-icon').addEventListener('click', showProfile);
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  
  // Close modal
  document.querySelector('.close-modal').addEventListener('click', () => {
    document.getElementById('camera-modal').classList.remove('active');
    stopCamera();
  });
}

async function handleSignIn(e) {
  e.preventDefault();
  console.log('=== SIGN IN ATTEMPT ===');
  console.log('Sign in button clicked');
  
  const email = document.getElementById('signin-email').value;
  const password = document.getElementById('signin-password').value;
  
  console.log('Email:', email);
  console.log('Password length:', password.length);
  console.log('API URL:', API_URL);
  
  if (!email || !password) {
    console.error('Missing email or password');
    alert('Please enter both email and password');
    return;
  }
  
  try {
    console.log('Sending login request to:', `${API_URL}/auth/signin`);
    console.log('Request body:', JSON.stringify({ email, password: '***' }));
    
    const response = await fetch(`${API_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('Token:', data.token ? 'Received' : 'Missing');
      console.log('User:', data.user);
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      currentUser = data.user;
      currentLanguage = data.user.language;
      
      console.log('Showing dashboard...');
      showDashboard();
      initializeSocket();
      loadVisitorLogs();
      
      console.log('✅ Login complete!');
    } else {
      console.error('❌ Login failed:', data.message);
      alert('Login failed: ' + data.message);
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    alert('Error signing in: ' + error.message + '\n\nCheck browser console (F12) for details.');
  }
}

async function handleSignUp(e) {
  e.preventDefault();
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const nickname = document.getElementById('signup-nickname').value;
  
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, nickname, language: currentLanguage })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      currentUser = data.user;
      showDashboard();
      initializeSocket();
    } else {
      alert(data.message);
    }
  } catch (error) {
    alert('Error signing up');
  }
}

function checkAuth() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (token && user) {
    currentUser = JSON.parse(user);
    currentLanguage = currentUser.language;
    showDashboard();
    initializeSocket();
    loadVisitorLogs();
  }
}

function showDashboard() {
  document.getElementById('auth-screen').classList.remove('active');
  document.getElementById('dashboard-screen').classList.add('active');
  document.getElementById('user-nickname').textContent = currentUser.nickname.charAt(0).toUpperCase();
  
  // Show/hide Generate OTP button based on admin status
  const generateOtpBtn = document.getElementById('generate-otp');
  const otpDisplay = document.getElementById('otp-display');
  const otpInfo = document.getElementById('otp-info');
  
  if (currentUser.isAdmin) {
    // Admin can generate OTP
    generateOtpBtn.style.display = 'block';
    otpDisplay.style.display = 'block';
    otpInfo.style.display = 'none';
  } else {
    // Regular users cannot generate OTP
    generateOtpBtn.style.display = 'none';
    otpDisplay.style.display = 'none';
    otpInfo.style.display = 'block';
  }
  
  updateTranslations();
}

function showProfile() {
  alert(`Profile: ${currentUser.nickname}\nEmail: ${currentUser.email}\nLanguage: ${currentLanguage}`);
}

function handleLogout() {
  // Stop voice chat if active
  if (voiceAssistant) {
    stopVoiceChat();
  }
  
  // Disconnect socket
  if (socket) {
    socket.disconnect();
  }
  
  // Clear local storage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Reset current user
  currentUser = null;
  
  // Show auth screen
  document.getElementById('dashboard-screen').classList.remove('active');
  document.getElementById('auth-screen').classList.add('active');
  
  // Reset forms
  document.getElementById('signin-form').reset();
  document.getElementById('signup-form').reset();
  
  alert('Logged out successfully');
}

function updateTranslations() {
  document.querySelectorAll('[data-translate]').forEach(el => {
    const key = el.dataset.translate;
    if (translations[currentLanguage][key]) {
      if (el.tagName === 'INPUT') {
        el.placeholder = translations[currentLanguage][key];
      } else {
        el.textContent = translations[currentLanguage][key];
      }
    }
  });
}

async function generateOTP() {
  try {
    const response = await fetch(`${API_URL}/door/generate-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    document.getElementById('otp-display').textContent = `OTP: ${data.otp}`;
  } catch (error) {
    alert('Error generating OTP');
  }
}

async function verifyOTP() {
  const otp = document.getElementById('otp-input').value;
  const user = JSON.parse(localStorage.getItem('user'));
  const userName = user?.nickname || user?.email || 'User';
  
  try {
    const response = await fetch(`${API_URL}/door/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp })
    });
    
    const data = await response.json();
    
    if (data.verified) {
      alert(`✓ OTP Verified!\n\nHello ${userName}!\n\nProceeding to facial recognition for identity verification...`);
      startFacialRecognition();
    } else {
      alert(`❌ OTP Verification Failed\n\n${data.message}\n\nPlease check your OTP and try again.`);
    }
  } catch (error) {
    alert('❌ Error verifying OTP\n\nPlease check your connection and try again.');
  }
}

async function startFacialRecognition() {
  try {
    // Get current user for personalized messages
    const user = JSON.parse(localStorage.getItem('user'));
    const userName = user?.nickname || user?.email || 'User';
    
    // Check if user has registered face
    const token = localStorage.getItem('token');
    const profileResponse = await fetch(`${API_URL}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const profile = await profileResponse.json();
    
    // If no face registered, capture and register automatically
    if (!profile.faceId) {
      console.log('⚠️ No face registered for this user. Starting automatic registration...');
      alert(`👤 Face Registration Required\n\nHello ${userName}!\n\nThis is your first time using face recognition.\nWe'll now capture your face for future access.\n\nPlease position your face in front of the camera.`);
      
      // Start automatic face registration
      const registered = await autoRegisterFace(user, token);
      
      if (!registered) {
        // If registration fails, still unlock with OTP only
        alert(`⚠️ Face Registration Failed\n\nUnlocking door with OTP only...\n\nYou can register your face later at:\nhttp://localhost:3000/face-registration.html`);
        
        const unlocked = await unlockDoor();
        if (unlocked) {
          await logVisitor(user.id, true);
          alert(`🚪 Door Unlocked!\n\nWelcome home, ${userName}!\n\nAccess granted at ${new Date().toLocaleTimeString()}`);
        }
        return;
      }
      
      // Registration successful, now verify the face
      alert(`✅ Face Registered Successfully!\n\nNow verifying your face...`);
    }
    
    // Show loading message
    alert(`Starting camera for facial recognition...\n\nHello ${userName}! Please position your face in front of the camera.`);
    
    // Perform facial recognition using ML model (now includes backend verification)
    const result = await performFacialRecognition();
    
    if (!result.success) {
      alert(result.message || 'Facial recognition failed');
      await logVisitor('UNKNOWN', false);
      return;
    }
    
    // Check if face was verified
    if (!result.verified) {
      const matchInfo = result.matchCount !== undefined ? `\nMatches: ${result.matchCount}/${result.totalSamples} (Required: 5+)` : '';
      alert(`❌ ACCESS DENIED!\n\n⚠️ This person is NOT the authenticated user!\n\nFace verification failed for ${userName}.\nSimilarity: ${(result.confidence * 100).toFixed(1)}% (Required: 70%+)${matchInfo}\n\nThe captured face does not match ${userName}'s registered profile.\n\nPlease ensure:\n- You are the account owner\n- Proper lighting conditions\n- Face clearly visible to camera`);
      await logVisitor(result.userId || 'UNKNOWN', false);
      return;
    }
    
    // Show verification success message
    alert(`✓ Face Detected: ${result.userName}\n\nVerification successful!\nConfidence: ${(result.confidence * 100).toFixed(1)}%\nMatched: ${result.matchCount} samples\n\nUnlocking door...`);
    
    // Face verified successfully - unlock door
    const unlocked = await unlockDoor();
    
    if (unlocked) {
      await logVisitor(result.userId, true);
      alert(`🚪 Door Unlocked!\n\nWelcome home, ${result.userName}!\n\nAccess granted at ${new Date().toLocaleTimeString()}\nDoor will close automatically in 5 seconds.`);
    } else {
      alert(`⚠️ Verification Successful but Door Unlock Failed\n\nYour face was verified, ${result.userName}, but the door control system is not responding.\n\nPlease check:\n- ESP32 is powered on\n- WiFi connection is active\n- Hardware is properly connected`);
    }
    
  } catch (error) {
    console.error('Facial recognition error:', error);
    alert('❌ Error in facial recognition:\n\n' + error.message);
  }
}

// Auto-register face during first access
async function autoRegisterFace(user, token) {
  const modal = document.getElementById('camera-modal');
  const statusText = document.getElementById('camera-status');
  const videoPreview = document.getElementById('camera-preview');
  
  try {
    console.log('📸 Starting automatic face registration...');
    
    // Show modal
    modal.classList.add('active');
    statusText.textContent = 'Initializing camera for face registration...';
    
    // Initialize face detection model
    if (!faceDetectionModel) {
      statusText.textContent = 'Loading face detection model...';
      console.log('Loading face detection model...');
      faceDetectionModel = await blazeface.load();
      console.log('✓ Model loaded');
    }
    
    // Start camera
    statusText.textContent = 'Starting camera...';
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 }
    });
    
    videoPreview.srcObject = stream;
    
    await new Promise((resolve) => {
      videoPreview.onloadedmetadata = () => resolve();
    });
    
    statusText.textContent = '✓ Camera ready! Starting face capture...';
    console.log('Camera started, capturing samples...');
    
    // Wait for camera to stabilize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Capture 10 face samples
    const faceSamples = [];
    const REQUIRED_SAMPLES = 10;
    
    const instructions = [
      'Look straight at the camera',
      'Turn head slightly left',
      'Turn head slightly right',
      'Tilt head slightly up',
      'Tilt head slightly down',
      'Smile naturally',
      'Neutral expression',
      'Look straight again',
      'Move closer to camera',
      'Final sample - hold still'
    ];
    
    for (let i = 0; i < REQUIRED_SAMPLES; i++) {
      statusText.textContent = `Sample ${i + 1}/${REQUIRED_SAMPLES}: ${instructions[i]}`;
      statusText.style.color = '#667eea';
      statusText.style.fontWeight = 'bold';
      
      console.log(`Capturing sample ${i + 1}/${REQUIRED_SAMPLES}: ${instructions[i]}`);
      
      // Wait for user to adjust
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Detect face with multiple attempts
      let faces = null;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        faces = await faceDetectionModel.estimateFaces(videoPreview, false);
        
        if (faces.length === 1 && faces[0].probability[0] > 0.7) {
          break;
        }
        
        if (faces.length === 0) {
          statusText.textContent = `⚠️ No face detected. Please position your face in view...`;
          statusText.style.color = '#ff9800';
        } else if (faces.length > 1) {
          statusText.textContent = `⚠️ Multiple faces detected. Only one person should be in frame...`;
          statusText.style.color = '#ff9800';
        } else if (faces[0].probability[0] < 0.7) {
          statusText.textContent = `⚠️ Low confidence (${(faces[0].probability[0] * 100).toFixed(0)}%). Adjusting...`;
          statusText.style.color = '#ff9800';
        }
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      if (!faces || faces.length === 0 || faces[0].probability[0] < 0.7) {
        console.warn(`Sample ${i + 1} failed after ${maxAttempts} attempts, retrying...`);
        statusText.textContent = `❌ Sample ${i + 1} failed. Retrying...`;
        statusText.style.color = '#f44336';
        await new Promise(resolve => setTimeout(resolve, 1000));
        i--;
        continue;
      }
      
      // Capture face image
      const canvas = document.getElementById('camera-canvas');
      canvas.width = videoPreview.videoWidth;
      canvas.height = videoPreview.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoPreview, 0, 0);
      
      const face = faces[0];
      const faceData = {
        image: canvas.toDataURL('image/jpeg', 0.9),
        landmarks: face.landmarks,
        topLeft: face.topLeft,
        bottomRight: face.bottomRight,
        probability: face.probability[0],
        timestamp: Date.now(),
        instruction: instructions[i]
      };
      
      faceSamples.push(faceData);
      
      statusText.textContent = `✓ Sample ${i + 1}/${REQUIRED_SAMPLES} captured! Confidence: ${(face.probability[0] * 100).toFixed(1)}%`;
      statusText.style.color = '#4caf50';
      
      console.log(`✓ Sample ${i + 1} captured: Confidence ${(face.probability[0] * 100).toFixed(1)}%`);
      
      // Brief pause to show success
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Stop camera
    stream.getTracks().forEach(track => track.stop());
    videoPreview.srcObject = null;
    
    statusText.textContent = `✓ All ${REQUIRED_SAMPLES} samples captured! Saving to server...`;
    statusText.style.color = '#4caf50';
    
    console.log(`✓ Captured ${REQUIRED_SAMPLES} samples, saving to server...`);
    
    // Save face data to server
    const response = await fetch(`${API_URL}/user/register-face`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userId: user.id,
        faceSamples: faceSamples
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      statusText.textContent = `✅ Face registered successfully! Face ID: ${data.faceId}`;
      statusText.style.color = '#4caf50';
      
      console.log('✅ Face registered successfully!');
      console.log('Face ID:', data.faceId);
      console.log('Sample count:', data.sampleCount);
      
      // Update user in localStorage
      user.faceId = data.faceId;
      localStorage.setItem('user', JSON.stringify(user));
      
      // Wait a moment to show success message
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Close modal
      modal.classList.remove('active');
      
      return true;
    } else {
      statusText.textContent = `❌ Registration failed: ${data.message}`;
      statusText.style.color = '#f44336';
      
      console.error('❌ Face registration failed:', data.message);
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      modal.classList.remove('active');
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ Auto-registration error:', error);
    
    statusText.textContent = `❌ Error: ${error.message}`;
    statusText.style.color = '#f44336';
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    modal.classList.remove('active');
    
    return false;
  }
}

async function unlockDoor() {
  try {
    console.log('Sending unlock command to ESP32...');
    
    const response = await fetch(`${API_URL}/door/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    console.log('Door unlock response:', data);
    
    if (response.ok) {
      console.log('✓ Door unlocked successfully');
      return true;
    } else {
      console.error('Failed to unlock door:', data.message);
      return false;
    }
  } catch (error) {
    console.error('Error unlocking door:', error);
    return false;
  }
}

async function logVisitor(personId, accessGranted) {
  try {
    await fetch(`${API_URL}/visitor/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personId,
        name: accessGranted ? currentUser.nickname : 'Unknown',
        accessGranted,
        emotionDetected: document.getElementById('emotion-text').textContent
      })
    });
    
    loadVisitorLogs();
  } catch (error) {
    console.error('Error logging visitor');
  }
}

async function loadVisitorLogs() {
  try {
    const response = await fetch(`${API_URL}/visitor/logs`);
    const visitors = await response.json();
    
    const visitorList = document.getElementById('visitor-list');
    visitorList.innerHTML = visitors.map(v => `
      <div class="visitor-item">
        <div>
          <strong>${v.name}</strong><br>
          <small>${new Date(v.timestamp).toLocaleString()}</small>
        </div>
        <div>${v.accessGranted ? '✅' : '❌'}</div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading visitor logs');
  }
}

async function startVoiceChat() {
  try {
    // Initialize voice assistant
    if (!voiceAssistant) {
      voiceAssistant = new VoiceAssistant(currentUser.nickname, currentLanguage);
    }
    
    // Initialize audio analysis
    const audioReady = await voiceAssistant.initializeAudioAnalysis();
    if (!audioReady) {
      alert('Could not initialize audio analysis. Voice chat will work with limited features.');
    }
    
    // Show stop button, hide start button
    document.getElementById('start-voice').style.display = 'none';
    document.getElementById('stop-voice').style.display = 'block';
    
    // Clear conversation display
    document.getElementById('conversation-display').innerHTML = '<p><em>🎤 Listening... Start speaking!</em></p>';
    
    // Start continuous listening
    const started = voiceAssistant.startContinuousListening(
      (result) => {
        // Update emotion display with confidence
        const confidencePercent = (result.confidence * 100).toFixed(0);
        document.getElementById('emotion-text').textContent = `${result.emotion} (${confidencePercent}%)`;
        
        // Update tone display
        if (result.tone) {
          document.getElementById('pitch-value').textContent = result.tone.pitch.toFixed(1);
          document.getElementById('energy-value').textContent = result.tone.energy.toFixed(1);
          document.getElementById('tempo-value').textContent = (result.tone.tempo * 100).toFixed(1) + '%';
        }
        
        // Add to conversation display
        addToConversation('user', result.text, result.emotion, result.confidence);
        addToConversation('assistant', result.response, null, null);
        
        // Send to server via socket
        if (socket) {
          socket.emit('voice-emotion', {
            emotion: result.emotion,
            confidence: result.confidence,
            user: currentUser.nickname,
            text: result.text,
            tone: result.tone,
            response: result.response
          });
        }
      },
      (emotion, confidence) => {
        // Emotion changed callback
        const confidencePercent = (confidence * 100).toFixed(0);
        document.getElementById('emotion-text').textContent = `${emotion} (${confidencePercent}%)`;
      }
    );
    
    if (!started) {
      alert('Could not start voice recognition. Please check your microphone permissions.');
      stopVoiceChat();
    }
    
  } catch (error) {
    console.error('Voice chat error:', error);
    alert('Voice chat error: ' + error.message);
    stopVoiceChat();
  }
}

function stopVoiceChat() {
  if (voiceAssistant) {
    voiceAssistant.stopListening();
  }
  
  // Show start button, hide stop button
  document.getElementById('start-voice').style.display = 'block';
  document.getElementById('stop-voice').style.display = 'none';
  
  // Reset displays
  document.getElementById('emotion-text').textContent = '-';
  document.getElementById('pitch-value').textContent = '-';
  document.getElementById('energy-value').textContent = '-';
  document.getElementById('tempo-value').textContent = '-';
}

function addToConversation(type, text, emotion, confidence) {
  const conversationDisplay = document.getElementById('conversation-display');
  
  // Remove "listening" message if present
  if (conversationDisplay.querySelector('em')) {
    conversationDisplay.innerHTML = '';
  }
  
  const item = document.createElement('div');
  item.className = `conversation-item ${type}`;
  
  const timestamp = new Date().toLocaleTimeString();
  let emotionBadge = '';
  
  if (emotion && confidence) {
    const confidencePercent = (confidence * 100).toFixed(0);
    emotionBadge = `<span class="emotion-badge">${emotion} ${confidencePercent}%</span>`;
  } else if (emotion) {
    emotionBadge = `<span class="emotion-badge">${emotion}</span>`;
  }
  
  item.innerHTML = `
    <div>${text}${emotionBadge}</div>
    <div class="timestamp">${timestamp}</div>
  `;
  
  conversationDisplay.appendChild(item);
  conversationDisplay.scrollTop = conversationDisplay.scrollHeight;
}

function initializeSocket() {
  socket = io('http://localhost:3000');
  
  socket.on('connect', () => {
    console.log('✓ Socket connected successfully');
  });
  
  socket.on('disconnect', () => {
    console.log('✗ Socket disconnected');
  });
  
  socket.on('emotion-detected', (data) => {
    console.log('Emotion detected:', data);
  });
  
  // Listen for keypad input
  socket.on('keypad-digit', (data) => {
    console.log('Keypad digit received:', data);
    handleKeypadInput(data.digit);
  });
  
  socket.on('keypad-cleared', () => {
    console.log('Keypad cleared');
    clearOTPInput();
  });
  
  socket.on('keypad-submitted', (data) => {
    console.log('Keypad submitted:', data);
    autoVerifyOTP();
  });
}

function handleKeypadInput(digit) {
  console.log('Handling keypad digit:', digit);
  const otpInput = document.getElementById('otp-input');
  
  if (!otpInput) {
    console.error('OTP input field not found!');
    return;
  }
  
  if (otpInput.value.length < 6) {
    otpInput.value += digit;
    console.log('OTP field updated:', otpInput.value);
    
    // Visual feedback
    otpInput.style.background = '#e8f5e9';
    setTimeout(() => {
      otpInput.style.background = '';
    }, 200);
    
    // Auto-verify when 6 digits are entered
    if (otpInput.value.length === 6) {
      console.log('6 digits entered, auto-verifying...');
      setTimeout(() => {
        verifyOTP();
      }, 500);
    }
  } else {
    console.log('OTP field is full (6 digits)');
  }
}

function clearOTPInput() {
  const otpInput = document.getElementById('otp-input');
  if (otpInput) {
    otpInput.value = '';
  }
}

function autoVerifyOTP() {
  const otpInput = document.getElementById('otp-input');
  if (otpInput && otpInput.value.length > 0) {
    verifyOTP();
  }
}
