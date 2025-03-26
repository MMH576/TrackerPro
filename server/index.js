require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// Import routes
const notificationRoutes = require('./routes/notification-routes');
const habitRoutes = require('./routes/habit-routes');
const pomodoroRoutes = require('./routes/pomodoro-routes');

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

// Active pomodoro sessions map
const activeSessions = new Map();

// Make io, connectedUsers, and supabase available to routes
app.set('io', io);
app.set('connectedUsers', connectedUsers);
app.set('supabase', supabase);
app.set('activeSessions', activeSessions);

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
  
  // Handle pomodoro started event
  socket.on('pomodoroStarted', (data) => {
    console.log('Received pomodoro started event:', data);
    
    // If team pomodoro is enabled, broadcast to team members
    if (data.isTeamPomodoro && Array.isArray(data.teamMembers)) {
      data.teamMembers.forEach(memberId => {
        const memberSocketId = connectedUsers.get(memberId);
        if (memberSocketId && memberSocketId !== socket.id) {
          io.to(memberSocketId).emit('pomodoroStarted', {
            ...data,
            fromTeammate: true
          });
        }
      });
    }
  });
  
  // Handle pomodoro completion
  socket.on('pomodoroCompleted', (data) => {
    console.log('Received pomodoro completion:', data);
    
    // Notify user's team members if this is for a team pomodoro
    if (data.teamId) {
      const teamMembers = app.get('teams')?.get(data.teamId) || [];
      
      teamMembers.forEach(memberId => {
        // Don't notify the user who completed the pomodoro
        if (memberId !== data.userId) {
          const memberSocketId = connectedUsers.get(memberId);
          if (!memberSocketId) return;
          
          // Format specific message based on the mode
          let messageText;
          if (data.mode === 'pomodoro') {
            messageText = `${data.userName || 'A team member'} completed a focus session`;
          } else if (data.mode === 'shortBreak') {
            messageText = `${data.userName || 'A team member'} completed a short break`;
          } else {
            messageText = `${data.userName || 'A team member'} completed a long break`;
          }
          
          io.to(memberSocketId).emit('notification', {
            type: 'pomodoro',
            title: 'Team Pomodoro Update',
            message: messageText,
            mode: data.newMode,
            fromTeammate: true,
            timestamp: Date.now()
          });
        }
      });
    }
    
    // Store notification in database if requested
    if (data.saveToDatabase) {
      let notificationType;
      let notificationMessage;
      
      // Format message based on the mode
      if (data.mode === 'pomodoro') {
        notificationType = 'pomodoro_complete';
        notificationMessage = 'Focus session completed';
      } else if (data.mode === 'shortBreak') {
        notificationType = 'short_break_complete';
        notificationMessage = 'Short break completed';
      } else {
        notificationType = 'long_break_complete';
        notificationMessage = 'Long break completed';
      }
      
      try {
        supabase
          .from('notifications')
          .insert({
            user_id: data.userId,
            message: notificationMessage,
            type: notificationType,
            related_id: null,
            is_read: false,
            metadata: {
              previousMode: data.mode,
              newMode: data.newMode,
              sessionsCompleted: data.sessionsCompleted,
              timestamp: data.timestamp || Date.now()
            }
          })
          .then(({ error }) => {
            if (error) {
              console.error('Error saving pomodoro notification:', error);
            }
          });
      } catch (error) {
        console.error('Error processing pomodoro notification:', error);
      }
    }
  });
  
  // Handle pomodoro state update
  socket.on('pomodoroStateUpdate', (data) => {
    console.log('Pomodoro state update:', data);
    
    if (!data.userId) {
      console.warn('Received pomodoroStateUpdate without userId');
      return;
    }
    
    // Store the session state
    const activeSessions = app.get('activeSessions') || new Map();
    
    // Get existing session or create new one
    const existingSession = activeSessions.get(data.userId) || {};
    
    // Calculate precise end time if timer is running
    let calculatedEndTime = data.endTime;
    if (data.isRunning && data.timeLeft) {
      calculatedEndTime = Date.now() + (data.timeLeft * 1000);
    }
    
    // Update with new data, ensuring precision
    const updatedSession = {
      ...existingSession,
      userId: data.userId,
      mode: data.mode || existingSession.mode,
      timeLeft: data.timeLeft !== undefined ? data.timeLeft : existingSession.timeLeft,
      isRunning: data.isRunning !== undefined ? data.isRunning : existingSession.isRunning,
      endTime: calculatedEndTime || existingSession.endTime,
      sessionsCompleted: data.sessionsCompleted !== undefined ? data.sessionsCompleted : existingSession.sessionsCompleted,
      settings: data.settings || existingSession.settings,
      lastUpdated: Date.now()
    };
    
    // Store updated session
    activeSessions.set(data.userId, updatedSession);
    
    // Make sure activeSessions is available to routes
    app.set('activeSessions', activeSessions);
    
    // If there are other devices for the same user logged in, sync the state
    if (data.syncAcrossDevices !== false) { // Sync by default unless explicitly disabled
      // Find all sockets for this user
      const userSockets = Array.from(io.sockets.sockets.values())
        .filter(s => s.id !== socket.id && s.data?.userId === data.userId);
      
      // Broadcast state update to other devices of the same user with precise timing data
      userSockets.forEach(userSocket => {
        // Calculate the remaining time based on endTime for precision
        const remainingMs = updatedSession.endTime - Date.now();
        const currentTimeLeft = updatedSession.isRunning && remainingMs > 0 
          ? Math.ceil(remainingMs / 1000) 
          : updatedSession.timeLeft;
        
        userSocket.emit('pomodoroStateSync', {
          ...updatedSession,
          timeLeft: currentTimeLeft,
          syncTimestamp: Date.now() // Add timestamp for client-side compensation
        });
      });
    }
  });
});

// API Routes
app.use('/api/notifications', notificationRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/pomodoro', pomodoroRoutes);

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