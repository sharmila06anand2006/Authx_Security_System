import face_recognition
import json
import os
import sys
from datetime import datetime

def train_new_face(image_path, person_name, user_id=None):
    """Train the model with a new face"""
    
    # Load the image
    try:
        image = face_recognition.load_image_file(image_path)
        face_encodings = face_recognition.face_encodings(image)
        
        if len(face_encodings) == 0:
            print("ERROR: No face detected in the image!", file=sys.stderr)
            return False
        
        if len(face_encodings) > 1:
            print(f"WARNING: Multiple faces detected ({len(face_encodings)}). Using the first one.", file=sys.stderr)
        
        # Get the first face encoding
        face_encoding = face_encodings[0]
        
        # Generate IDs
        if user_id is None:
            user_id = str(int(datetime.now().timestamp() * 1000))
        face_id = f"FACE_{user_id}_{int(datetime.now().timestamp() * 1000)}"
        
        # Get the directory of this script
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(script_dir)
        
        # Load existing face data
        face_data_path = os.path.join(project_root, "db", "data", "face_data.json")
        try:
            with open(face_data_path, 'r') as f:
                face_data = json.load(f)
        except:
            face_data = {}
        
        # Convert encoding to list for JSON serialization
        encoding_list = face_encoding.tolist()
        
        # Add new face data (only encoding, image will be added by Node.js)
        if face_id not in face_data:
            face_data[face_id] = {
                "faceId": face_id,
                "userId": user_id,
                "samples": []
            }
        
        face_data[face_id]["samples"].append({
            "encoding": encoding_list,
            "timestamp": datetime.now().isoformat()
        })
        
        # Save face data
        with open(face_data_path, 'w') as f:
            json.dump(face_data, f, indent=2)
        
        # Update registered users
        users_path = os.path.join(project_root, "db", "data", "registered_users.json")
        try:
            with open(users_path, 'r') as f:
                users = json.load(f)
        except:
            users = []
        
        # Add user if not exists
        user_exists = any(u.get('userId') == user_id for u in users)
        if not user_exists:
            users.append({
                "userId": user_id,
                "name": person_name,
                "faceId": face_id,
                "registeredAt": datetime.now().isoformat()
            })
            
            with open(users_path, 'w') as f:
                json.dump(users, f, indent=2)
        
        print(f"SUCCESS: Face registered for {person_name}")
        print(f"User ID: {user_id}")
        print(f"Face ID: {face_id}")
        return True
        
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return False

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python train_face.py <image_path> <person_name> [user_id]")
        sys.exit(1)
    
    image_path = sys.argv[1]
    person_name = sys.argv[2]
    user_id = sys.argv[3] if len(sys.argv) > 3 else None
    
    train_new_face(image_path, person_name, user_id)
