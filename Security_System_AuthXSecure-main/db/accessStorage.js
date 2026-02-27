const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, 'data');
const ACCESS_REQUESTS_FILE = path.join(DB_DIR, 'access_requests.json');
const REGISTERED_USERS_FILE = path.join(DB_DIR, 'registered_users.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize files
if (!fs.existsSync(ACCESS_REQUESTS_FILE)) {
  fs.writeFileSync(ACCESS_REQUESTS_FILE, JSON.stringify([]));
}

if (!fs.existsSync(REGISTERED_USERS_FILE)) {
  fs.writeFileSync(REGISTERED_USERS_FILE, JSON.stringify([]));
}

class AccessStorage {
  // Access Requests
  readAccessRequests() {
    const data = fs.readFileSync(ACCESS_REQUESTS_FILE, 'utf8');
    return JSON.parse(data);
  }

  writeAccessRequests(requests) {
    fs.writeFileSync(ACCESS_REQUESTS_FILE, JSON.stringify(requests, null, 2));
  }

  createAccessRequest(requestData) {
    const requests = this.readAccessRequests();
    const newRequest = {
      id: Date.now().toString(),
      ...requestData,
      createdAt: new Date().toISOString()
    };
    requests.push(newRequest);
    this.writeAccessRequests(requests);
    return newRequest;
  }

  getAccessRequestById(id) {
    const requests = this.readAccessRequests();
    return requests.find(r => r.id === id);
  }

  updateAccessRequest(id, updates) {
    const requests = this.readAccessRequests();
    const index = requests.findIndex(r => r.id === id);
    if (index !== -1) {
      requests[index] = { ...requests[index], ...updates };
      this.writeAccessRequests(requests);
      return requests[index];
    }
    return null;
  }

  getAllAccessRequests() {
    return this.readAccessRequests().sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  getPendingAccessRequests() {
    return this.readAccessRequests().filter(r => r.status === 'pending');
  }

  // Registered Users (for known categories)
  readRegisteredUsers() {
    const data = fs.readFileSync(REGISTERED_USERS_FILE, 'utf8');
    return JSON.parse(data);
  }

  writeRegisteredUsers(users) {
    fs.writeFileSync(REGISTERED_USERS_FILE, JSON.stringify(users, null, 2));
  }

  registerUser(userData) {
    const users = this.readRegisteredUsers();
    const newUser = {
      id: Date.now().toString(),
      ...userData,
      registeredAt: new Date().toISOString()
    };
    users.push(newUser);
    this.writeRegisteredUsers(users);
    return newUser;
  }

  findUserByPhone(phoneNumber) {
    const users = this.readRegisteredUsers();
    return users.find(u => u.phoneNumber === phoneNumber);
  }

  findUserByCategory(category) {
    const users = this.readRegisteredUsers();
    return users.filter(u => u.category === category);
  }

  getAllRegisteredUsers() {
    return this.readRegisteredUsers();
  }
}

module.exports = new AccessStorage();
