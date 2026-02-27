const express = require('express');
const router = express.Router();
const storage = require('../db/storage');
const jwt = require('jsonwebtoken');

// Middleware to verify admin
const adminMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = storage.findUserById(decoded.userId);
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    req.userId = decoded.userId;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get dashboard statistics
router.get('/statistics', adminMiddleware, (req, res) => {
  try {
    const stats = storage.getStatistics();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

// Get all users
router.get('/users', adminMiddleware, (req, res) => {
  try {
    const users = storage.readUsers().map(u => {
      const { password, ...userWithoutPassword } = u;
      return userWithoutPassword;
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Update user
router.put('/users/:id', adminMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Don't allow password updates through this route
    delete updates.password;
    
    const user = storage.updateUser(id, updates);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const { password, ...userWithoutPassword } = user;
    res.json({ message: 'User updated', user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

// Delete user
router.delete('/users/:id', adminMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const deleted = storage.deleteUser(id);
    
    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

// Get all access logs
router.get('/access-logs', adminMiddleware, (req, res) => {
  try {
    const { limit, phone, category } = req.query;
    
    let logs;
    if (phone) {
      logs = storage.getAccessLogsByPhone(phone);
    } else if (category) {
      logs = storage.getAccessLogsByCategory(category);
    } else {
      logs = storage.getAccessLogs(limit ? parseInt(limit) : 100);
    }
    
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching logs', error: error.message });
  }
});

// Get all requests
router.get('/requests', adminMiddleware, (req, res) => {
  try {
    const requests = storage.getAllRequests();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching requests', error: error.message });
  }
});

// Get visitors by date range
router.get('/visitors/range', adminMiddleware, (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date required' });
    }
    
    const visitors = storage.getVisitorsByDateRange(startDate, endDate);
    res.json(visitors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching visitors', error: error.message });
  }
});

// Get visitors by category
router.get('/visitors/category/:category', adminMiddleware, (req, res) => {
  try {
    const { category } = req.params;
    const visitors = storage.getVisitorsByCategory(category);
    res.json(visitors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching visitors', error: error.message });
  }
});

// Cleanup old data
router.post('/cleanup', adminMiddleware, (req, res) => {
  try {
    const { daysToKeep } = req.body;
    const result = storage.cleanupOldData(daysToKeep || 30);
    res.json({ message: 'Cleanup completed', result });
  } catch (error) {
    res.status(500).json({ message: 'Error during cleanup', error: error.message });
  }
});

// Export data (backup)
router.get('/export', adminMiddleware, (req, res) => {
  try {
    const data = {
      users: storage.readUsers().map(u => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword;
      }),
      visitors: storage.getAllVisitors(),
      requests: storage.getAllRequests(),
      accessLogs: storage.getAccessLogs(1000),
      exportedAt: new Date().toISOString()
    };
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error exporting data', error: error.message });
  }
});

module.exports = router;
