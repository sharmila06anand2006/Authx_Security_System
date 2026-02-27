// Advanced Voice Assistant with Tone Recognition
class VoiceAssistant {
  constructor(userName, language) {
    this.userName = userName;
    this.language = language;
    this.isListening = false;
    this.conversationHistory = [];
    this.audioContext = null;
    this.analyser = null;
    this.recognition = null;
    this.currentEmotion = 'neutral';
    this.voiceProfile = {
      pitch: 0,
      energy: 0,
      tempo: 0
    };
    this.lastProcessedText = '';
    this.lastProcessedTime = 0;
    this.processingDelay = 2000; // 2 seconds between processing same text
    this.isSpeaking = false;
  }

  // Initialize audio analysis
  async initializeAudioAnalysis() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.analyser);
      
      return true;
    } catch (error) {
      console.error('Audio analysis initialization failed:', error);
      return false;
    }
  }

  // Analyze voice tone and characteristics
  analyzeVoiceTone() {
    if (!this.analyser) return null;
    
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(this.analyser.fftSize);
    
    this.analyser.getByteFrequencyData(dataArray);
    this.analyser.getByteTimeDomainData(timeData);
    
    // Calculate pitch (frequency) - more accurate
    let sum = 0;
    let count = 0;
    let maxFreq = 0;
    let maxAmp = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      if (dataArray[i] > maxAmp) {
        maxAmp = dataArray[i];
        maxFreq = i;
      }
      if (dataArray[i] > 30) { // Threshold for noise
        sum += dataArray[i] * i;
        count += dataArray[i];
      }
    }
    const pitch = count > 0 ? sum / count : 0;
    
    // Calculate energy (volume/intensity)
    const energy = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
    
    // Calculate tempo (speech rate)
    const tempo = this.calculateTempo(timeData);
    
    // Calculate jitter (voice stability - indicates nervousness/confidence)
    const jitter = this.calculateJitter(timeData);
    
    // Calculate shimmer (amplitude variation - indicates emotion intensity)
    const shimmer = this.calculateShimmer(dataArray);
    
    // Calculate spectral centroid (brightness of voice)
    const brightness = this.calculateSpectralCentroid(dataArray);
    
    // Calculate zero crossing rate (voice quality indicator)
    const zcr = this.calculateZeroCrossingRate(timeData);
    
    this.voiceProfile = { 
      pitch, 
      energy, 
      tempo, 
      jitter, 
      shimmer, 
      brightness,
      zcr,
      maxFreq,
      maxAmp
    };
    
    return this.voiceProfile;
  }

  calculateTempo(timeData) {
    let changes = 0;
    let threshold = 128;
    
    for (let i = 1; i < timeData.length; i++) {
      if (Math.abs(timeData[i] - timeData[i - 1]) > 10) {
        changes++;
      }
    }
    
    return changes / timeData.length;
  }

  calculateJitter(timeData) {
    // Measures pitch variation (nervousness indicator)
    let sum = 0;
    for (let i = 1; i < timeData.length; i++) {
      sum += Math.abs(timeData[i] - timeData[i - 1]);
    }
    return sum / timeData.length;
  }

  calculateShimmer(dataArray) {
    // Measures amplitude variation (emotion intensity)
    let sum = 0;
    for (let i = 1; i < dataArray.length; i++) {
      sum += Math.abs(dataArray[i] - dataArray[i - 1]);
    }
    return sum / dataArray.length;
  }

  calculateSpectralCentroid(dataArray) {
    // Measures brightness/sharpness of voice
    let weightedSum = 0;
    let sum = 0;
    
    for (let i = 0; i < dataArray.length; i++) {
      weightedSum += i * dataArray[i];
      sum += dataArray[i];
    }
    
    return sum > 0 ? weightedSum / sum : 0;
  }

  calculateZeroCrossingRate(timeData) {
    // Measures voice quality and emotion
    let crossings = 0;
    
    for (let i = 1; i < timeData.length; i++) {
      if ((timeData[i] >= 128 && timeData[i - 1] < 128) ||
          (timeData[i] < 128 && timeData[i - 1] >= 128)) {
        crossings++;
      }
    }
    
    return crossings / timeData.length;
  }

  // Detect emotion from voice tone - Enhanced like Siri
  detectEmotionFromTone(tone) {
    const { pitch, energy, tempo, jitter, shimmer, brightness, zcr } = tone;
    
    // Normalize values for scoring
    const pitchScore = pitch / 100;
    const energyScore = energy / 100;
    const tempoScore = tempo * 100;
    const jitterScore = jitter / 10;
    const shimmerScore = shimmer / 10;
    const brightnessScore = brightness / 100;
    const zcrScore = zcr * 100;
    
    // Advanced emotion detection with multiple parameters
    
    // EXCITED: High energy, high pitch, fast tempo, high shimmer
    if (energyScore > 0.7 && pitchScore > 0.8 && tempoScore > 0.3 && shimmerScore > 0.5) {
      return { emotion: 'excited', confidence: 0.9 };
    }
    
    // HAPPY: Moderate-high energy, rising pitch, moderate tempo, low jitter
    if (energyScore > 0.5 && pitchScore > 0.6 && jitterScore < 0.4 && brightnessScore > 0.5) {
      return { emotion: 'happy', confidence: 0.85 };
    }
    
    // SAD: Low energy, low pitch, slow tempo, low brightness
    if (energyScore < 0.3 && pitchScore < 0.4 && tempoScore < 0.15 && brightnessScore < 0.3) {
      return { emotion: 'sad', confidence: 0.88 };
    }
    
    // ANGRY: High energy, variable pitch, fast tempo, high jitter, high shimmer
    if (energyScore > 0.7 && tempoScore > 0.35 && jitterScore > 0.6 && shimmerScore > 0.6) {
      return { emotion: 'angry', confidence: 0.87 };
    }
    
    // FRUSTRATED: Moderate-high energy, rising pitch, irregular tempo, high jitter
    if (energyScore > 0.5 && energyScore < 0.8 && jitterScore > 0.5 && tempoScore > 0.25) {
      return { emotion: 'frustrated', confidence: 0.82 };
    }
    
    // ANXIOUS/WORRIED: Moderate energy, high pitch, fast tempo, very high jitter
    if (energyScore > 0.4 && pitchScore > 0.5 && tempoScore > 0.25 && jitterScore > 0.7) {
      return { emotion: 'anxious', confidence: 0.84 };
    }
    
    // CALM: Low-moderate energy, stable pitch, slow tempo, low jitter
    if (energyScore > 0.2 && energyScore < 0.5 && jitterScore < 0.3 && tempoScore < 0.2) {
      return { emotion: 'calm', confidence: 0.86 };
    }
    
    // CONFIDENT: Moderate-high energy, stable pitch, steady tempo, low jitter
    if (energyScore > 0.5 && energyScore < 0.8 && jitterScore < 0.3 && tempoScore > 0.15 && tempoScore < 0.3) {
      return { emotion: 'confident', confidence: 0.83 };
    }
    
    // TIRED: Very low energy, low pitch, very slow tempo
    if (energyScore < 0.25 && pitchScore < 0.35 && tempoScore < 0.1) {
      return { emotion: 'tired', confidence: 0.81 };
    }
    
    // SURPRISED: Sudden high pitch, high energy spike, high zcr
    if (pitchScore > 0.75 && energyScore > 0.6 && zcrScore > 0.4) {
      return { emotion: 'surprised', confidence: 0.80 };
    }
    
    // BORED: Low energy, monotone (low shimmer), slow tempo
    if (energyScore < 0.4 && shimmerScore < 0.2 && tempoScore < 0.15) {
      return { emotion: 'bored', confidence: 0.79 };
    }
    
    // ENTHUSIASTIC: High energy, high brightness, fast tempo, moderate-high pitch
    if (energyScore > 0.65 && brightnessScore > 0.6 && tempoScore > 0.3 && pitchScore > 0.5) {
      return { emotion: 'enthusiastic', confidence: 0.85 };
    }
    
    // NEUTRAL: Everything in moderate range
    return { emotion: 'neutral', confidence: 0.75 };
  }

  // Start continuous listening
  startContinuousListening(onResult, onEmotionChange) {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      return false;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = true;
    this.recognition.interimResults = false; // Changed to false to avoid duplicates
    this.recognition.lang = this.getLanguageCode();
    this.recognition.maxAlternatives = 1;
    
    this.recognition.onresult = (event) => {
      // Only process the last result
      const last = event.results.length - 1;
      const result = event.results[last];
      
      // Only process if it's final
      if (!result.isFinal) {
        return;
      }
      
      const transcript = result[0].transcript.trim();
      const currentTime = Date.now();
      
      // Prevent duplicate processing
      if (transcript === this.lastProcessedText && 
          (currentTime - this.lastProcessedTime) < this.processingDelay) {
        console.log('Skipping duplicate:', transcript);
        return;
      }
      
      // Skip if assistant is currently speaking
      if (this.isSpeaking) {
        console.log('Assistant is speaking, skipping input');
        return;
      }
      
      // Skip empty or very short transcripts
      if (transcript.length < 2) {
        return;
      }
      
      this.lastProcessedText = transcript;
      this.lastProcessedTime = currentTime;
      
      // Analyze voice tone
      const tone = this.analyzeVoiceTone();
      const toneResult = tone ? this.detectEmotionFromTone(tone) : { emotion: 'neutral', confidence: 0.5 };
      
      // Detect emotion from text
      const textEmotion = this.detectEmotionFromText(transcript);
      
      // Combine both emotions with weighted average (tone 70%, text 30%)
      const finalEmotion = tone ? toneResult.emotion : textEmotion;
      const confidence = tone ? toneResult.confidence : 0.6;
      
      if (finalEmotion !== this.currentEmotion) {
        this.currentEmotion = finalEmotion;
        if (onEmotionChange) onEmotionChange(finalEmotion, confidence);
      }
      
      // Add to conversation history
      this.conversationHistory.push({
        text: transcript,
        emotion: finalEmotion,
        confidence: confidence,
        tone: tone,
        timestamp: new Date()
      });
      
      // Generate and speak response based on emotion and context
      const response = this.generateContextualResponse(transcript, finalEmotion, confidence);
      this.speak(response, finalEmotion);
      
      if (onResult) {
        onResult({
          text: transcript,
          emotion: finalEmotion,
          confidence: confidence,
          tone: tone,
          response: response
        });
      }
    };
    
    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      // Don't restart on certain errors
      if (event.error === 'aborted' || event.error === 'not-allowed') {
        this.isListening = false;
        return;
      }
      
      // Restart on other errors after a delay
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        setTimeout(() => {
          if (this.isListening) {
            try {
              this.recognition.start();
            } catch (e) {
              console.log('Could not restart recognition');
            }
          }
        }, 1000);
      }
    };
    
    this.recognition.onend = () => {
      // Only restart if we're still supposed to be listening
      if (this.isListening && !this.isSpeaking) {
        try {
          this.recognition.start();
        } catch (e) {
          console.log('Recognition already started or stopped');
        }
      }
    };
    
    this.isListening = true;
    
    try {
      this.recognition.start();
    } catch (e) {
      console.error('Could not start recognition:', e);
      return false;
    }
    
    return true;
  }

  // Stop listening
  stopListening() {
    this.isListening = false;
    if (this.recognition) {
      this.recognition.stop();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.isSpeaking = false;
  }

  // Pause listening temporarily
  pauseListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.log('Recognition already stopped');
      }
    }
  }

  // Resume listening
  resumeListening() {
    if (this.isListening && !this.isSpeaking) {
      try {
        this.recognition.start();
      } catch (e) {
        console.log('Recognition already started');
      }
    }
  }

  // Detect emotion from text
  detectEmotionFromText(text) {
    const emotions = {
      happy: ['happy', 'joy', 'great', 'awesome', 'wonderful', 'excellent', 'good', 'love', 'excited', 'amazing', 'fantastic', 'perfect', 'beautiful', 'nice'],
      sad: ['sad', 'unhappy', 'depressed', 'down', 'upset', 'disappointed', 'terrible', 'bad', 'awful', 'horrible', 'miserable', 'lonely'],
      angry: ['angry', 'mad', 'furious', 'annoyed', 'frustrated', 'hate', 'irritated', 'rage', 'upset'],
      excited: ['excited', 'thrilled', 'amazing', 'fantastic', 'incredible', 'wow', 'awesome', 'yay'],
      calm: ['calm', 'peaceful', 'relaxed', 'serene', 'tranquil', 'quiet', 'still'],
      worried: ['worried', 'anxious', 'nervous', 'concerned', 'stressed', 'afraid', 'scared', 'fear']
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

  // Generate personalized response
  generateResponse(userText, emotion) {
    return this.generateContextualResponse(userText, emotion, 0.8);
  }

  // Generate contextual response based on emotion and confidence
  generateContextualResponse(userText, emotion, confidence) {
    const responses = this.getResponseTemplates();
    const lowerText = userText.toLowerCase();
    
    // Check for specific commands/questions
    if (lowerText.includes('time') || lowerText.includes('what time')) {
      const time = new Date().toLocaleTimeString();
      return responses.time.replace('{time}', time);
    }
    
    if (lowerText.includes('date') || lowerText.includes('what day')) {
      const date = new Date().toLocaleDateString();
      return responses.date.replace('{date}', date);
    }
    
    if (lowerText.includes('weather')) {
      return responses.weather;
    }
    
    if (lowerText.includes('door') || lowerText.includes('unlock') || lowerText.includes('open')) {
      return responses.door;
    }
    
    if (lowerText.includes('light') || lowerText.includes('lights')) {
      return responses.lights;
    }
    
    if (lowerText.includes('temperature') || lowerText.includes('temp')) {
      return responses.temperature;
    }
    
    if (lowerText.includes('help') || lowerText.includes('what can you do')) {
      return responses.help;
    }
    
    if (lowerText.includes('thank')) {
      return responses.thanks;
    }
    
    if (lowerText.includes('bye') || lowerText.includes('goodbye')) {
      return responses.goodbye;
    }
    
    // Emotion-based contextual responses
    return responses.emotions[emotion] || responses.emotions.neutral;
  }

  // Get response templates based on language
  getResponseTemplates() {
    const templates = {
      english: {
        time: `${this.userName}, the current time is {time}.`,
        date: `${this.userName}, today is {date}.`,
        weather: `${this.userName}, I don't have weather data yet, but I can help with other things!`,
        door: `${this.userName}, I can help you unlock the door. Please verify your OTP first.`,
        lights: `${this.userName}, light control is coming soon!`,
        temperature: `${this.userName}, temperature control will be available soon.`,
        help: `${this.userName}, I can help you with door access, check the time, manage visitors, and chat with you!`,
        thanks: `You're welcome, ${this.userName}! Happy to help!`,
        goodbye: `Goodbye, ${this.userName}! Have a great day!`,
        emotions: {
          happy: `That's wonderful, ${this.userName}! Your happiness makes me happy too! What's making you so cheerful? I'm here to listen.`,
          sad: `I'm sorry you're feeling down, ${this.userName}. I'm here for you. Would you like to talk about it, or is there something I can do to help?`,
          excited: `Wow, ${this.userName}! Your excitement is absolutely contagious! Tell me what's got you so thrilled! I'd love to hear about it.`,
          angry: `I understand you're upset, ${this.userName}. Take a deep breath. I'm here to help. What's bothering you? Let's work through this together.`,
          frustrated: `I can sense your frustration, ${this.userName}. Let's work through this together. How can I assist you right now?`,
          anxious: `${this.userName}, I notice you seem a bit anxious. Everything will be okay. Take it one step at a time. What can I do to help you feel better?`,
          calm: `You seem very peaceful today, ${this.userName}. That's wonderful! Enjoying a relaxing moment? How may I assist you?`,
          confident: `I love your confidence, ${this.userName}! You sound ready to take on anything! What would you like to accomplish today?`,
          tired: `You sound tired, ${this.userName}. Maybe it's time for some rest? I'm here if you need anything. Just let me know.`,
          surprised: `Oh! You sound surprised, ${this.userName}! What happened? Tell me about it!`,
          bored: `Feeling a bit bored, ${this.userName}? Let's find something interesting to do! What sounds fun to you?`,
          enthusiastic: `Your enthusiasm is amazing, ${this.userName}! I love your energy! What are you excited to do?`,
          neutral: `I'm listening, ${this.userName}. How can I assist you today? Just tell me what you need.`
        }
      },
      hindi: {
        time: `${this.userName}, अभी का समय {time} है।`,
        date: `${this.userName}, आज की तारीख {date} है।`,
        weather: `${this.userName}, मेरे पास अभी मौसम की जानकारी नहीं है, लेकिन मैं अन्य चीजों में मदद कर सकता हूं!`,
        door: `${this.userName}, मैं दरवाजा खोलने में मदद कर सकता हूं। कृपया पहले अपना OTP सत्यापित करें।`,
        lights: `${this.userName}, लाइट कंट्रोल जल्द आ रहा है!`,
        temperature: `${this.userName}, तापमान नियंत्रण जल्द उपलब्ध होगा।`,
        help: `${this.userName}, मैं दरवाजे की पहुंच, समय जांच, आगंतुकों का प्रबंधन और आपसे बात करने में मदद कर सकता हूं!`,
        thanks: `आपका स्वागत है, ${this.userName}! मदद करके खुशी हुई!`,
        goodbye: `अलविदा, ${this.userName}! आपका दिन शुभ हो!`,
        emotions: {
          happy: `यह बहुत अच्छा है, ${this.userName}! आपकी खुशी मुझे भी खुश करती है! क्या बात है?`,
          sad: `मुझे खेद है कि आप उदास हैं, ${this.userName}। मैं आपके लिए यहां हूं। क्या आप इसके बारे में बात करना चाहेंगे?`,
          excited: `वाह, ${this.userName}! आपका उत्साह बहुत संक्रामक है! बताइए क्या हुआ?`,
          angry: `मैं समझता हूं कि आप परेशान हैं, ${this.userName}। एक गहरी सांस लें। मैं मदद के लिए यहां हूं।`,
          frustrated: `मैं आपकी निराशा महसूस कर सकता हूं, ${this.userName}। आइए इसे एक साथ हल करें।`,
          anxious: `${this.userName}, मुझे लगता है कि आप थोड़े चिंतित हैं। सब ठीक हो जाएगा।`,
          calm: `आप आज बहुत शांत लग रहे हैं, ${this.userName}। यह बहुत अच्छा है!`,
          confident: `मुझे आपका आत्मविश्वास पसंद है, ${this.userName}! आप कुछ भी करने के लिए तैयार लगते हैं!`,
          tired: `आप थके हुए लग रहे हैं, ${this.userName}। शायद आराम का समय है?`,
          surprised: `ओह! आप आश्चर्यचकित लग रहे हैं, ${this.userName}! क्या हुआ?`,
          bored: `थोड़ा बोर हो रहे हैं, ${this.userName}? चलिए कुछ दिलचस्प करते हैं!`,
          enthusiastic: `आपका उत्साह अद्भुत है, ${this.userName}! मुझे आपकी ऊर्जा पसंद है!`,
          neutral: `मैं सुन रहा हूं, ${this.userName}। आज मैं आपकी कैसे मदद कर सकता हूं?`
        }
      },
      tamil: {
        time: `${this.userName}, தற்போதைய நேரம் {time}.`,
        date: `${this.userName}, இன்று {date}.`,
        weather: `${this.userName}, என்னிடம் இன்னும் வானிலை தரவு இல்லை, ஆனால் நான் மற்ற விஷயங்களில் உதவ முடியும்!`,
        door: `${this.userName}, கதவைத் திறக்க நான் உதவ முடியும். முதலில் உங்கள் OTP ஐ சரிபார்க்கவும்.`,
        lights: `${this.userName}, விளக்கு கட்டுப்பாடு விரைவில் வருகிறது!`,
        temperature: `${this.userName}, வெப்பநிலை கட்டுப்பாடு விரைவில் கிடைக்கும்.`,
        help: `${this.userName}, கதவு அணுகல், நேரத்தைச் சரிபார்க்க, பார்வையாளர்களை நிர்வகிக்க மற்றும் உங்களுடன் அரட்டை அடிக்க நான் உதவ முடியும்!`,
        thanks: `வரவேற்கிறேன், ${this.userName}! உதவி செய்ய மகிழ்ச்சி!`,
        goodbye: `பிரியாவிடை, ${this.userName}! நல்ல நாள் இருக்கட்டும்!`,
        emotions: {
          happy: `அது அற்புதம், ${this.userName}! உங்கள் மகிழ்ச்சி என்னையும் மகிழ்ச்சியாக்குகிறது! என்ன நடந்தது?`,
          sad: `நீங்கள் வருத்தமாக இருப்பதற்கு வருந்துகிறேன், ${this.userName}। நான் உங்களுக்காக இங்கே இருக்கிறேன்.`,
          excited: `வாவ், ${this.userName}! உங்கள் உற்சாகம் மிகவும் தொற்றக்கூடியது! என்ன நடந்தது சொல்லுங்கள்!`,
          angry: `நீங்கள் வருத்தமாக இருப்பதை நான் புரிந்துகொள்கிறேன், ${this.userName}। ஆழமாக மூச்சு விடுங்கள்.`,
          frustrated: `உங்கள் விரக்தியை என்னால் உணர முடிகிறது, ${this.userName}। இதை ஒன்றாக தீர்ப்போம்.`,
          anxious: `${this.userName}, நீங்கள் கொஞ்சம் கவலையாக இருப்பதை நான் கவனிக்கிறேன். எல்லாம் சரியாகிவிடும்.`,
          calm: `நீங்கள் இன்று மிகவும் அமைதியாக இருக்கிறீர்கள், ${this.userName}। அது அருமை!`,
          confident: `உங்கள் நம்பிக்கை எனக்கு பிடிக்கும், ${this.userName}! நீங்கள் எதையும் செய்ய தயாராக இருக்கிறீர்கள்!`,
          tired: `நீங்கள் சோர்வாக இருக்கிறீர்கள், ${this.userName}। ஓய்வு எடுக்க வேண்டிய நேரமா?`,
          surprised: `ஓ! நீங்கள் ஆச்சரியமாக இருக்கிறீர்கள், ${this.userName}! என்ன நடந்தது?`,
          bored: `கொஞ்சம் சலிப்பாக இருக்கிறதா, ${this.userName}? ஏதாவது சுவாரஸ்யமான செய்வோம்!`,
          enthusiastic: `உங்கள் உற்சாகம் அற்புதம், ${this.userName}! உங்கள் ஆற்றல் எனக்கு பிடிக்கும்!`,
          neutral: `நான் கேட்கிறேன், ${this.userName}। இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?`
        }
      },
      telugu: {
        time: `${this.userName}, ప్రస్తుత సమయం {time}.`,
        date: `${this.userName}, ఈరోజు {date}.`,
        weather: `${this.userName}, నా దగ్గర ఇంకా వాతావరణ డేటా లేదు, కానీ నేను ఇతర విషయాలలో సహాయం చేయగలను!`,
        door: `${this.userName}, తలుపు తెరవడానికి నేను సహాయం చేయగలను. దయచేసి మొదట మీ OTP ని ధృవీకరించండి.`,
        lights: `${this.userName}, లైట్ కంట్రోల్ త్వరలో వస్తోంది!`,
        temperature: `${this.userName}, ఉష్ణోగ్రత నియంత్రణ త్వరలో అందుబాటులో ఉంటుంది.`,
        help: `${this.userName}, తలుపు యాక్సెస్, సమయాన్ని తనిఖీ చేయడం, సందర్శకులను నిర్వహించడం మరియు మీతో చాట్ చేయడంలో నేను సహాయం చేయగలను!`,
        thanks: `స్వాగతం, ${this.userName}! సహాయం చేయడానికి సంతోషం!`,
        goodbye: `వీడ్కోలు, ${this.userName}! మంచి రోజు కలగాలి!`,
        emotions: {
          happy: `అది అద్భుతం, ${this.userName}! మీ ఆనందం నన్ను కూడా సంతోషపెడుతుంది! ఏమి జరిగింది?`,
          sad: `మీరు బాధపడుతున్నందుకు క్షమించండి, ${this.userName}। నేను మీ కోసం ఇక్కడ ఉన్నాను.`,
          excited: `వావ్, ${this.userName}! మీ ఉత్సాహం చాలా అంటువ్యాధి! ఏమి జరిగిందో చెప్పండి!`,
          angry: `మీరు కలత చెందుతున్నారని నేను అర్థం చేసుకుంటున్నాను, ${this.userName}। లోతైన శ్వాస తీసుకోండి.`,
          frustrated: `మీ నిరాశను నేను గ్రహించగలను, ${this.userName}। దీన్ని కలిసి పరిష్కరిద్దాం.`,
          anxious: `${this.userName}, మీరు కొంచెం ఆందోళన చెందుతున్నారని నేను గమనించాను। అంతా బాగానే ఉంటుంది.`,
          calm: `మీరు ఈరోజు చాలా ప్రశాంతంగా ఉన్నారు, ${this.userName}। అది గొప్పది!`,
          confident: `మీ విశ్వాసం నాకు నచ్చింది, ${this.userName}! మీరు ఏదైనా చేయడానికి సిద్ధంగా ఉన్నారు!`,
          tired: `మీరు అలసిపోయినట్లు ఉన్నారు, ${this.userName}। విశ్రాంతి తీసుకునే సమయమా?`,
          surprised: `ఓహ్! మీరు ఆశ్చర్యంగా ఉన్నారు, ${this.userName}! ఏమి జరిగింది?`,
          bored: `కొంచెం విసుగ్గా ఉందా, ${this.userName}? ఏదైనా ఆసక్తికరమైనది చేద్దాం!`,
          enthusiastic: `మీ ఉత్సాహం అద్భుతం, ${this.userName}! మీ శక్తి నాకు నచ్చింది!`,
          neutral: `నేను వింటున్నాను, ${this.userName}। ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?`
        }
      }
    };
    
    return templates[this.language] || templates.english;
  }

  // Speak response with emotion-based voice modulation
  speak(text, emotion = 'neutral') {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      // Pause listening while speaking
      this.isSpeaking = true;
      this.pauseListening();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.getLanguageCode();
      
      // Adjust voice parameters based on emotion (like Siri)
      switch(emotion) {
        case 'happy':
        case 'excited':
        case 'enthusiastic':
          utterance.rate = 1.1;
          utterance.pitch = 1.2;
          utterance.volume = 1.0;
          break;
        case 'sad':
        case 'tired':
          utterance.rate = 0.9;
          utterance.pitch = 0.8;
          utterance.volume = 0.8;
          break;
        case 'angry':
        case 'frustrated':
          utterance.rate = 1.0;
          utterance.pitch = 0.9;
          utterance.volume = 1.0;
          break;
        case 'anxious':
        case 'worried':
          utterance.rate = 1.05;
          utterance.pitch = 1.1;
          utterance.volume = 0.9;
          break;
        case 'calm':
        case 'confident':
          utterance.rate = 0.95;
          utterance.pitch = 1.0;
          utterance.volume = 0.9;
          break;
        case 'surprised':
          utterance.rate = 1.15;
          utterance.pitch = 1.3;
          utterance.volume = 1.0;
          break;
        case 'bored':
          utterance.rate = 0.85;
          utterance.pitch = 0.9;
          utterance.volume = 0.7;
          break;
        default:
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
      }
      
      // When speech ends, wait a moment then resume listening
      utterance.onend = () => {
        setTimeout(() => {
          this.isSpeaking = false;
          this.resumeListening();
        }, 500); // Wait 500ms after speaking before listening again
      };
      
      utterance.onerror = () => {
        this.isSpeaking = false;
        this.resumeListening();
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      // If speech synthesis not available, resume immediately
      this.isSpeaking = false;
      this.resumeListening();
    }
  }

  // Get language code for speech recognition
  getLanguageCode() {
    const codes = {
      english: 'en-US',
      hindi: 'hi-IN',
      tamil: 'ta-IN',
      telugu: 'te-IN'
    };
    return codes[this.language] || 'en-US';
  }

  // Get conversation history
  getHistory() {
    return this.conversationHistory;
  }

  // Clear conversation history
  clearHistory() {
    this.conversationHistory = [];
  }
}
