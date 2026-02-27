const express = require('express');
const router = express.Router();
const storage = require('../db/storage');

// Log visitor entry with access log
router.post('/log', async (req, res) => {
  try {
    const { personId, name, imageUrl, accessGranted, emotionDetected, phone, category } = req.body;
    
    const visitor = storage.createVisitor({
      personId,
      name: name || 'Unknown',
      phone: phone || null,
      category: category || 'guest',
      imageUrl,
      accessGranted,
      emotionDetected
    });
    
    // Also log in access logs
    storage.logAccess({
      personId,
      name: name || 'Unknown',
      phone: phone || null,
      category: category || 'guest',
      accessGranted,
      method: 'facial_recognition',
      emotionDetected
    });
    
    res.status(201).json({
      message: 'Visitor logged successfully',
      visitor
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all visitor logs
router.get('/logs', async (req, res) => {
  try {
    const visitors = storage.getAllVisitors();
    res.json(visitors);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get visitor by ID
router.get('/logs/:personId', async (req, res) => {
  try {
    const visitors = storage.getVisitorsByPersonId(req.params.personId);
    res.json(visitors);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get visitors by category
router.get('/category/:category', async (req, res) => {
  try {
    const visitors = storage.getVisitorsByCategory(req.params.category);
    res.json(visitors);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
