import cv2
import face_recognition
import numpy as np
import requests
import json
from datetime import datetime

# API endpoint
API_URL = "http://localhost:3000/api"

# Load known faces
known_face_encodings = []
known_face_names = []

def load_known_faces():
    """Load known faces from dataset"""
    # Add your known faces here
    # Example:
    # image = face_recognition.load_image_file("person1.jpg")
    # encoding = face_recognition.face_encodings(image)[0]
    # known_face_encodings.append(encoding)
    # known_face_names.append("Person 1")
    pass

def verify_otp_and_start_camera(otp):
    """Verify OTP and start facial recognition"""
    # Verify OTP
    response = requests.post(f"{API_URL}/door/verify-otp", 
                           json={"otp": otp})
    
    if response.json().get("verified"):
        print("OTP verified. Starting facial recognition...")
        return recognize_face()
    else:
        print("Invalid OTP")
        return False

def recognize_face():
    """Capture and recognize face"""
    video_capture = cv2.VideoCapture(0)
    
    print("Camera started. Looking for faces...")
    
    face_found = False
    person_id = None
    
    for _ in range(30):  # Try for 30 frames
        ret, frame = video_capture.read()
        
        if not ret:
            continue
        
        # Find faces
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_frame)
        face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)
        
        for face_encoding in face_encodings:
            # Compare with known faces
            matches = face_recognition.compare_faces(known_face_encodings, face_encoding)
            name = "Unknown"
            
            if True in matches:
                first_match_index = matches.index(True)
                name = known_face_names[first_match_index]
                face_found = True
                person_id = f"PERSON_{first_match_index}"
                break
            else:
                # Unknown person
                person_id = f"UNKNOWN_{datetime.now().timestamp()}"
        
        if face_found:
            break
    
    video_capture.release()
    
    if face_found:
        print(f"Face recognized: {name}")
        unlock_door()
        log_visitor(person_id, name, True)
        return True
    else:
        print("Face not recognized")
        log_visitor(person_id or "UNKNOWN", "Unknown", False)
        return False

def unlock_door():
    """Send unlock command to ESP32"""
    try:
        requests.post(f"{API_URL}/door/unlock")
        print("Door unlocked")
    except Exception as e:
        print(f"Error unlocking door: {e}")

def log_visitor(person_id, name, access_granted):
    """Log visitor entry"""
    try:
        requests.post(f"{API_URL}/visitor/log", 
                     json={
                         "personId": person_id,
                         "name": name,
                         "accessGranted": access_granted,
                         "timestamp": datetime.now().isoformat()
                     })
        print("Visitor logged")
    except Exception as e:
        print(f"Error logging visitor: {e}")

def detect_emotion(frame):
    """Detect emotion from face (placeholder)"""
    # Integrate emotion detection library here
    # Example: DeepFace, FER, etc.
    emotions = ["happy", "sad", "neutral", "angry", "surprised"]
    return np.random.choice(emotions)

if __name__ == "__main__":
    load_known_faces()
    
    # Example usage
    otp = input("Enter OTP: ")
    verify_otp_and_start_camera(otp)
