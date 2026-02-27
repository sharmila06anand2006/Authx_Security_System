const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DB_DIR, 'users.json');
const VISITORS_FILE = path.join(DB_DIR, 'visitors.json');
const OTP_FILE = path.join(DB_DIR, 'otps.json');
const REQUESTS_FILE = path.join(DB_DIR, 'requests.json');
const ACCESS_LOG_FILE = path.join(DB_DIR, 'access_logs.json');
const FACE_DATA_FILE = path.join(DB_DIR, 'face_data.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize files if they don't exist
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}

if (!fs.existsSync(VISITORS_FILE)) {
  fs.writeFileSync(VISITORS_FILE, JSON.stringify([]));
}

if (!fs.existsSync(OTP_FILE)) {
  fs.writeFileSync(OTP_FILE, JSON.stringify([]));
}

if (!fs.existsSync(REQUESTS_FILE)) {
  fs.writeFileSync(REQUESTS_FILE, JSON.stringify([]));
}

if (!fs.existsSync(ACCESS_LOG_FILE)) {
  fs.writeFileSync(ACCESS_LOG_FILE, JSON.stringify([]));
}

if (!fs.existsSync(FACE_DATA_FILE)) {
  fs.writeFileSync(FACE_DATA_FILE, JSON.stringify({}));
}

class Storage {
  // Users Management
  readUsers() {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  }

  writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  }

  findUserByEmail(email) {
    const users = this.readUsers();
    return users.find(u => u.email === email);
  }

  findUserById(id) {
    const users = this.readUsers();
    return users.find(u => u.id === id);
  }

  findUserByPhone(phone) {
    const users = this.readUsers();
    return users.find(u => u.phone === phone);
  }

  createUser(userData) {
    const users = this.readUsers();
    const newUser = {
      id: Date.now().toString(),
      ...userData,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      accessCount: 0
    };
    users.push(newUser);
    this.writeUsers(users);
    return newUser;
  }

  updateUser(id, updates) {
    const users = this.readUsers();
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates, updatedAt: new Date().toISOString() };
      this.writeUsers(users);
      return users[index];
    }
    return null;
  }

  deleteUser(id) {
    const users = this.readUsers();
    const filtered = users.filter(u => u.id !== id);
    this.writeUsers(filtered);
    return filtered.length < users.length;
  }

  // Visitors Management
  readVisitors() {
    const data = fs.readFileSync(VISITORS_FILE, 'utf8');
    return JSON.parse(data);
  }

  writeVisitors(visitors) {
    fs.writeFileSync(VISITORS_FILE, JSON.stringify(visitors, null, 2));
  }

  createVisitor(visitorData) {
    const visitors = this.readVisitors();
    const newVisitor = {
      id: Date.now().toString(),
      ...visitorData,
      timestamp: new Date().toISOString()
    };
    visitors.push(newVisitor);
    this.writeVisitors(visitors);
    return newVisitor;
  }

  getAllVisitors() {
    return this.readVisitors().sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  }

  getVisitorsByPersonId(personId) {
    const visitors = this.readVisitors();
    return visitors.filter(v => v.personId === personId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  getVisitorsByCategory(category) {
    const visitors = this.readVisitors();
    return visitors.filter(v => v.category === category)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  getVisitorsByDateRange(startDate, endDate) {
    const visitors = this.readVisitors();
    return visitors.filter(v => {
      const vDate = new Date(v.timestamp);
      return vDate >= new Date(startDate) && vDate <= new Date(endDate);
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // OTP Management
  readOTPs() {
    const data = fs.readFileSync(OTP_FILE, 'utf8');
    return JSON.parse(data);
  }

  writeOTPs(otps) {
    fs.writeFileSync(OTP_FILE, JSON.stringify(otps, null, 2));
  }

  storeOTP(phone, otp, category, expiresAt) {
    const otps = this.readOTPs();
    const newOTP = {
      id: Date.now().toString(),
      phone,
      otp,
      category,
      expiresAt,
      used: false,
      createdAt: new Date().toISOString()
    };
    otps.push(newOTP);
    this.writeOTPs(otps);
    return newOTP;
  }

  getOTP(phone) {
    const otps = this.readOTPs();
    return otps.find(o => o.phone === phone && !o.used && Date.now() < o.expiresAt);
  }

  markOTPUsed(phone) {
    const otps = this.readOTPs();
    const otp = otps.find(o => o.phone === phone && !o.used);
    if (otp) {
      otp.used = true;
      otp.usedAt = new Date().toISOString();
      this.writeOTPs(otps);
    }
  }

  cleanExpiredOTPs() {
    const otps = this.readOTPs();
    const valid = otps.filter(o => Date.now() < o.expiresAt || o.used);
    this.writeOTPs(valid);
  }

  // Pending Access Requests
  readRequests() {
    const data = fs.readFileSync(REQUESTS_FILE, 'utf8');
    return JSON.parse(data);
  }

  writeRequests(requests) {
    fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2));
  }

  storePendingRequest(requestData) {
    const requests = this.readRequests();
    const request = {
      id: Date.now().toString(),
      ...requestData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      otp: null
    };
    requests.push(request);
    this.writeRequests(requests);
    return request;
  }

  getPendingRequests() {
    return this.readRequests().filter(r => r.status === 'pending');
  }

  getAllRequests() {
    return this.readRequests().sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  getRequestById(requestId) {
    const requests = this.readRequests();
    return requests.find(r => r.id === requestId);
  }

  updateRequestStatus(requestId, status, otp = null) {
    const requests = this.readRequests();
    const request = requests.find(r => r.id === requestId);
    if (request) {
      request.status = status;
      if (otp) request.otp = otp;
      request.updatedAt = new Date().toISOString();
      this.writeRequests(requests);
    }
    return request;
  }

  // Access Logs
  readAccessLogs() {
    const data = fs.readFileSync(ACCESS_LOG_FILE, 'utf8');
    return JSON.parse(data);
  }

  writeAccessLogs(logs) {
    fs.writeFileSync(ACCESS_LOG_FILE, JSON.stringify(logs, null, 2));
  }

  logAccess(accessData) {
    const logs = this.readAccessLogs();
    const log = {
      id: Date.now().toString(),
      ...accessData,
      timestamp: new Date().toISOString()
    };
    logs.push(log);
    this.writeAccessLogs(logs);
    return log;
  }

  getAccessLogs(limit = 100) {
    const logs = this.readAccessLogs();
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
  }

  getAccessLogsByPhone(phone) {
    const logs = this.readAccessLogs();
    return logs.filter(l => l.phone === phone)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  getAccessLogsByCategory(category) {
    const logs = this.readAccessLogs();
    return logs.filter(l => l.category === category)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Statistics
  getStatistics() {
    const users = this.readUsers();
    const visitors = this.readVisitors();
    const requests = this.readRequests();
    const logs = this.readAccessLogs();

    return {
      totalUsers: users.length,
      usersByCategory: {
        family: users.filter(u => u.category === 'family').length,
        friends: users.filter(u => u.category === 'friends').length,
        servants: users.filter(u => u.category === 'servants').length,
        service: users.filter(u => u.category === 'service').length,
        guest: users.filter(u => u.category === 'guest').length
      },
      totalVisitors: visitors.length,
      totalAccessLogs: logs.length,
      pendingRequests: requests.filter(r => r.status === 'pending').length,
      approvedRequests: requests.filter(r => r.status === 'approved').length,
      rejectedRequests: requests.filter(r => r.status === 'rejected').length,
      todayVisitors: visitors.filter(v => {
        const today = new Date().toDateString();
        return new Date(v.timestamp).toDateString() === today;
      }).length
    };
  }

  // Cleanup old data
  cleanupOldData(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Clean old visitors
    const visitors = this.readVisitors();
    const recentVisitors = visitors.filter(v => new Date(v.timestamp) > cutoffDate);
    this.writeVisitors(recentVisitors);

    // Clean old requests
    const requests = this.readRequests();
    const recentRequests = requests.filter(r => new Date(r.createdAt) > cutoffDate);
    this.writeRequests(recentRequests);

    // Clean expired OTPs
    this.cleanExpiredOTPs();

    return {
      visitorsRemoved: visitors.length - recentVisitors.length,
      requestsRemoved: requests.length - recentRequests.length
    };
  }

  // Face Data Management
  readFaceData() {
    const data = fs.readFileSync(FACE_DATA_FILE, 'utf8');
    return JSON.parse(data);
  }

  writeFaceData(faceData) {
    fs.writeFileSync(FACE_DATA_FILE, JSON.stringify(faceData, null, 2));
  }

  saveFaceData(faceId, data) {
    const allFaceData = this.readFaceData();
    allFaceData[faceId] = data;
    this.writeFaceData(allFaceData);
    return data;
  }

  getFaceData(faceId) {
    const allFaceData = this.readFaceData();
    return allFaceData[faceId];
  }

  deleteFaceData(faceId) {
    const allFaceData = this.readFaceData();
    delete allFaceData[faceId];
    this.writeFaceData(allFaceData);
  }
}

module.exports = new Storage();
