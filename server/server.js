// ============================================
// server.js — Main Application Entry Point
// FitSync Fitness Tracking System
// ============================================
require('dotenv').config();
const fs = require('fs');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { runSeed } = require('./utils/seedData');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const server = http.createServer(app);

// Allowed CORS origins. In a same-origin deploy the frontend is served by this
// server so CORS is not exercised; in a split deploy set CLIENT_URL to the
// frontend origin (e.g. https://your-site.netlify.app).
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: allowedOrigins.length ? allowedOrigins : true, // `true` reflects request origin
  credentials: true,
};

// ── Socket.IO Setup ───────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length ? allowedOrigins : '*',
    methods: ['GET', 'POST'],
  },
});

// Track connected users { socketId: userId }
const connectedUsers = {};

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // User identifies themselves
  socket.on('user_connected', (userId) => {
    connectedUsers[socket.id] = userId;
    socket.join(`user_${userId}`); // Join personal room
    io.emit('active_users_count', Object.keys(connectedUsers).length);
    console.log(`👤 User ${userId} joined`);
  });

  // Workout logged event
  socket.on('workout_logged', (data) => {
    socket.to(`user_${data.userId}`).emit('workout_notification', {
      message: `Workout "${data.workoutName}" logged!`,
      timestamp: new Date(),
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    delete connectedUsers[socket.id];
    io.emit('active_users_count', Object.keys(connectedUsers).length);
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

// Attach io to app so controllers can use it
app.set('io', io);

// ── Middleware ────────────────────────────────────────
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure the uploads directory exists (needed by multer disk storage)
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Serve client files (frontend)
const clientDir = path.join(__dirname, '..', 'client');
app.use(express.static(clientDir));

// ── API Routes ────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/workouts', require('./routes/workoutRoutes'));
app.use('/api/meals', require('./routes/nutritionRoutes'));
app.use('/api/goals', require('./routes/goalRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// ── Health Check Route ────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FitSync API is running 💪',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ── Unknown API routes → JSON 404 (not the SPA shell) ──
app.use('/api', notFound);

// ── Catch-all: Serve frontend for any non-API route ──
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(clientDir, 'index.html'));
});

// ── Error Handling ────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  // Optional one-shot seeding for fresh cloud deploys: set SEED_ON_START=true
  if (String(process.env.SEED_ON_START).toLowerCase() === 'true') {
    try {
      await runSeed();
    } catch (err) {
      console.error('⚠️  Seed on start failed:', err.message);
    }
  }

  server.listen(PORT, () => {
    console.log('\n========================================');
    console.log(`  🏋️  FitSync Server Running`);
    console.log(`  📡 Port: ${PORT}`);
    console.log(`  🌐 URL: http://localhost:${PORT}`);
    console.log(`  🔧 Mode: ${process.env.NODE_ENV}`);
    console.log('========================================\n');
  });
};

start();

module.exports = { app, server, io };
