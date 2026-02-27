const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for face images
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/visitor', require('./routes/visitor'));
app.use('/api/door', require('./routes/door'));
app.use('/api/user', require('./routes/user'));
app.use('/api/qr-access', require('./routes/qr-access'));
app.use('/api/access', require('./routes/access'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/face', require('./routes/face'));

// Socket.io for real-time communication
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('voice-emotion', (data) => {
    io.emit('emotion-detected', data);
  });
  
  // Keypad input from hardware
  socket.on('keypad-input', (data) => {
    console.log('Keypad input received:', data);
    // Broadcast to all connected clients (website)
    io.emit('keypad-digit', data);
  });
  
  // Clear keypad input
  socket.on('keypad-clear', () => {
    io.emit('keypad-cleared');
  });
  
  // Submit keypad OTP
  socket.on('keypad-submit', (data) => {
    io.emit('keypad-submitted', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

console.log('Using file-based storage (no MongoDB required)');

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});

module.exports = { io };
