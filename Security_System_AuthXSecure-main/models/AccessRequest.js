// Access request model for tracking door access attempts
class AccessRequest {
  constructor(data) {
    this.id = data.id || Date.now().toString();
    this.visitorName = data.visitorName || 'Unknown';
    this.category = data.category || 'guest';
    this.phoneNumber = data.phoneNumber || null;
    this.otp = data.otp || null;
    this.otpGeneratedBy = data.otpGeneratedBy || null;
    this.otpGeneratedAt = data.otpGeneratedAt || null;
    this.otpVerified = data.otpVerified || false;
    this.faceVerified = data.faceVerified || false;
    this.faceImageUrl = data.faceImageUrl || null;
    this.accessGranted = data.accessGranted || false;
    this.accessTime = data.accessTime || null;
    this.status = data.status || 'pending'; // pending, otp_sent, verified, denied
    this.createdAt = data.createdAt || new Date().toISOString();
  }
}

module.exports = AccessRequest;
