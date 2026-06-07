const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const xss = require('xss-clean');
const path = require('path');
require('dotenv').config();

const { initializeDatabase } = require('./config/db');
const { verifyMailSetup } = require('./config/mail');
const { seedDefaultAdmin } = require('./controllers/authController');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const contactRoutes = require('./routes/contact');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS settings
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const logger = require('./utils/logger');

// Middleware configuration
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "script-src": ["'self'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
      "style-src": ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
      "img-src": ["'self'", "data:", "https://*"],
      "connect-src": ["'self'", "ws:", "wss:", "http://ip-api.com"]
    }
  }
}));

app.use(cors({
  origin: '*', // Adjust to specific domain in production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(xss());



// Attach Socket.io instance to request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Apply general API rate limiter to backend api routes
app.use('/api/', apiLimiter);



// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/analytics', analyticsRoutes);

// Serve Static Frontend Files
app.use(express.static(path.join(__dirname, '../public')));

// Fallback to portfolio index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Socket.io Real-Time Event Handlers
let activeSessions = new Set();
io.on('connection', (socket) => {
  socket.on('register_session', (sessionId) => {
    socket.sessionId = sessionId;
    activeSessions.add(sessionId);
    // Broadcast updated visitor count to all connected clients
    io.emit('live_visitors_count', activeSessions.size);
  });

  socket.on('disconnect', () => {
    if (socket.sessionId) {
      activeSessions.delete(socket.sessionId);
      io.emit('live_visitors_count', activeSessions.size);
    }
  });
});

// Attach global error handler and not-found handler
const { notFound, errorHandler } = require('./middleware/errorHandler');
app.use(notFound);
app.use(errorHandler);

// Start initialization and server
const PORT = process.env.PORT || 5000;
async function startServer() {
  // Initialize Database
  await initializeDatabase();
  
  // Seed Default Admin User
  await seedDefaultAdmin();

  // Verify Mail Configuration
  await verifyMailSetup();

  server.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`📡 WebSocket server initialized.`);
  });
}

// Handle global promise rejections & exceptions gracefully
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('⚠ Uncaught Exception thrown:', err.message);
});

startServer();
