require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// Import routes
const notificationRoutes = require('./routes/notification-routes');
const habitRoutes = require('./routes/habit-routes');

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Create Socket.io server
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Connected users map
const connectedUsers = new Map();

// Make io, connectedUsers, and supabase available to routes
app.set('io', io);
app.set('connectedUsers', connectedUsers);
app.set('supabase', supabase);

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Get user ID from query parameters
  const userId = socket.handshake.query.userId;
  if (userId) {
    // Store socket connection with user ID
    connectedUsers.set(userId, socket.id);
    console.log(`User ${userId} connected with socket ${socket.id}`);
  }
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Remove user from connected users map
    if (userId) {
      connectedUsers.delete(userId);
      console.log(`User ${userId} disconnected`);
    }
  });
  
  // Handle notification event
  socket.on('notification', async (data) => {
    console.log('Received notification event:', data);
    
    try {
      // Save notification to database if needed
      if (data.saveToDatabase) {
        const { error } = await supabase
          .from('notifications')
          .insert({
            user_id: data.userId,
            message: data.message,
            type: data.type,
            related_id: data.relatedId || null,
            is_read: false,
            metadata: data.metadata || null
          });
          
        if (error) throw error;
      }
      
      // Emit notification to specific user
      const targetSocketId = connectedUsers.get(data.userId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('notification', data);
        console.log(`Notification sent to user ${data.userId}`);
      } else {
        console.log(`User ${data.userId} is not connected, notification not delivered`);
      }
    } catch (error) {
      console.error('Error processing notification:', error);
    }
  });
  
  // Handle friend request event
  socket.on('friendRequest', (data) => {
    console.log('Received friend request event:', data);
    
    const targetSocketId = connectedUsers.get(data.receiverId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('friendRequest', data);
      console.log(`Friend request sent to user ${data.receiverId}`);
    }
  });
  
  // Handle friend request accepted event
  socket.on('friendRequestAccepted', (data) => {
    console.log('Received friend request accepted event:', data);
    
    const targetSocketId = connectedUsers.get(data.requesterId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('friendRequestAccepted', data);
      console.log(`Friend request accepted notification sent to user ${data.requesterId}`);
    }
  });
  
  // Handle challenge joined event
  socket.on('challengeJoined', (data) => {
    console.log('Received challenge joined event:', data);
    
    // Broadcast to all users in the challenge
    socket.broadcast.emit('challengeJoined', data);
  });
  
  // Handle challenge left event
  socket.on('challengeLeft', (data) => {
    console.log('Received challenge left event:', data);
    
    // Broadcast to all users in the challenge
    socket.broadcast.emit('challengeLeft', data);
  });
  
  // Handle challenge updated event
  socket.on('challengeUpdated', (data) => {
    console.log('Received challenge updated event:', data);
    
    // Broadcast to all users in the challenge
    socket.broadcast.emit('challengeUpdated', data);
  });
});

// API Routes
app.use('/api/notifications', notificationRoutes);
app.use('/api/habits', habitRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// 404 Error handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 