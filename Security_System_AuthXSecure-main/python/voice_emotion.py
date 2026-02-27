import speech_recognition as sr
import numpy as np
from textblob import TextBlob
import requests

API_URL = "http://localhost:3000/api"

class VoiceEmotionDetector:
    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.microphone = sr.Microphone()
        
    def listen_and_detect(self):
        """Listen to voice and detect emotion"""
        with self.microphone as source:
            print("Listening... Speak now!")
            self.recognizer.adjust_for_ambient_noise(source)
            audio = self.recognizer.listen(source)
        
        try:
            # Convert speech to text
            text = self.recognizer.recognize_google(audio)
            print(f"You said: {text}")
            
            # Analyze sentiment
            emotion = self.analyze_emotion(text)
            print(f"Detected emotion: {emotion}")
            
            return text, emotion
            
        except sr.UnknownValueError:
            print("Could not understand audio")
            return None, None
        except sr.RequestError as e:
            print(f"Error: {e}")
            return None, None
    
    def analyze_emotion(self, text):
        """Analyze emotion from text"""
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity
        
        if polarity > 0.3:
            return "happy"
        elif polarity < -0.3:
            return "sad"
        elif polarity > 0.1:
            return "excited"
        elif polarity < -0.1:
            return "worried"
        else:
            return "neutral"
    
    def send_emotion_to_server(self, emotion, user_nickname):
        """Send emotion data to server"""
        try:
            requests.post(f"{API_URL}/emotion", 
                         json={
                             "emotion": emotion,
                             "user": user_nickname,
                             "timestamp": datetime.now().isoformat()
                         })
        except Exception as e:
            print(f"Error sending emotion: {e}")

def main():
    detector = VoiceEmotionDetector()
    
    print("Voice Emotion Detection Started")
    print("Say something to detect your emotion...")
    
    while True:
        text, emotion = detector.listen_and_detect()
        
        if text and emotion:
            print(f"\nText: {text}")
            print(f"Emotion: {emotion}\n")
        
        continue_listening = input("Continue? (y/n): ")
        if continue_listening.lower() != 'y':
            break

if __name__ == "__main__":
    main()
