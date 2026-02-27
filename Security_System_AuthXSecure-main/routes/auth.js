const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const storage = require('../db/storage');

// Fixed admin credentials
const ADMIN_EMAIL = 'admin@smarthome.com';
const ADMIN_PASSWORD = 'Admin@123';
const ADMIN_NICKNAME = 'Administrator';

// Initialize admin account on startup
async function initializeAdmin() {
  const existingAdmin = storage.findUserByEmail(ADMIN_EMAIL);
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    storage.createUser({
      email: ADMIN_EMAIL,
      password: hashedPassword,
      nickname: ADMIN_NICKNAME,
      language: 'english',
      phone: null,
      category: 'admin',
      voiceProfile: null,
      faceId: null,
      isAdmin: true
    });
    console.log('Admin account initialized');
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
  }
}

// Initialize admin on module load
initializeAdmin();

// Sign up with category
router.post('/signup', async (req, res) => {
  try {
    const { email, password, nickname, language, phone, category } = req.body;
    
    // Prevent creating another admin account
    if (email === ADMIN_EMAIL) {
      return res.status(400).json({ message: 'This email is reserved' });
    }
    
    const existingUser = storage.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = storage.createUser({
      email,
      password: hashedPassword,
      nickname,
      language: language || 'english',
      phone: phone || null,
      category: category || 'guest',
      voiceProfile: null,
      faceId: null,
      isAdmin: false
    });
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        language: user.language,
        category: user.category,
        phone: user.phone,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Sign in
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = storage.findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        language: user.language,
        category: user.category,
        phone: user.phone,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check if user exists by phone
router.post('/check-phone', async (req, res) => {
  try {
    const { phone } = req.body;
    const user = storage.findUserByPhone(phone);
    
    res.json({
      exists: !!user,
      category: user ? user.category : null,
      requiresApproval: user ? false : true
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
