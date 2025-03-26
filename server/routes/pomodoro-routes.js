const express = require('express');
const router = express.Router();

// Track sessions in memory
const activeSessions = new Map();

// Get active pomodoro sessions
router.get('/', async (req, res) => {
  try {
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    const supabase = req.app.get('supabase');
    
    // Return list of active sessions from memory
    const activeSessionsArray = Array.from(activeSessions.entries()).map(([userId, session]) => ({
      userId,
      mode: session.mode,
      endTime: session.endTime,
      isRunning: session.isRunning,
      timeLeft: session.timeLeft,
      sessionsCompleted: session.sessionsCompleted
    }));
    
    res.status(200).json({
      success: true,
      data: {
        activeSessions: activeSessionsArray
      }
    });
  } catch (error) {
    console.error('Error getting pomodoro sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve pomodoro sessions'
    });
  }
});

// Update a pomodoro session state
router.post('/update', async (req, res) => {
  try {
    const { userId, mode, timeLeft, isRunning, endTime, sessionsCompleted, settings } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing user ID'
      });
    }
    
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    
    // Update session in memory
    activeSessions.set(userId, {
      mode,
      timeLeft,
      isRunning,
      endTime,
      sessionsCompleted,
      settings,
      lastUpdated: Date.now()
    });
    
    // Sync information to connected clients
    const socketId = connectedUsers.get(userId);
    if (socketId && io) {
      io.to(socketId).emit('pomodoroStateUpdate', {
        userId,
        mode,
        timeLeft,
        isRunning,
        endTime,
        sessionsCompleted
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Pomodoro session updated'
    });
  } catch (error) {
    console.error('Error updating pomodoro session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update pomodoro session'
    });
  }
});

// Handle session completion
router.post('/complete', async (req, res) => {
  try {
    const { userId, mode, newMode, sessionsCompleted } = req.body;
    
    if (!userId || !mode || !newMode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    const supabase = req.app.get('supabase');
    
    // Get session from memory
    const sessionData = activeSessions.get(userId);
    
    if (sessionData) {
      // Update session state
      sessionData.mode = newMode;
      sessionData.isRunning = false;
      sessionData.sessionsCompleted = sessionsCompleted;
      sessionData.lastUpdated = Date.now();
      
      // Reset timer based on new mode
      if (newMode === 'pomodoro') {
        sessionData.timeLeft = sessionData.settings.pomodoroTime * 60;
      } else if (newMode === 'shortBreak') {
        sessionData.timeLeft = sessionData.settings.shortBreakTime * 60;
      } else {
        sessionData.timeLeft = sessionData.settings.longBreakTime * 60;
      }
      
      // Save updated session
      activeSessions.set(userId, sessionData);
    }
    
    // Record completed session in database if needed
    try {
      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .insert({
          user_id: userId,
          mode: mode,
          duration_seconds: mode === 'pomodoro' 
            ? (sessionData?.settings?.pomodoroTime || 25) * 60 
            : mode === 'shortBreak' 
              ? (sessionData?.settings?.shortBreakTime || 5) * 60
              : (sessionData?.settings?.longBreakTime || 15) * 60,
          completed_at: new Date().toISOString(),
          session_number: sessionsCompleted
        });
      
      if (error) {
        console.error('Error saving session to database:', error);
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
    }
    
    // Send notification to user if connected
    const socketId = connectedUsers.get(userId);
    if (socketId && io) {
      // Generate appropriate title and message based on the completed mode
      let title, message;
      
      if (mode === 'pomodoro') {
        title = 'Focus Session Completed!';
        message = newMode === 'longBreak' 
          ? `Great job! Time for a long break.` 
          : `Great job! Time for a short break.`;
      } else if (mode === 'shortBreak') {
        title = 'Short Break Completed!';
        message = 'Break time is over. Ready to focus again?';
      } else if (mode === 'longBreak') {
        title = 'Long Break Completed!';
        message = 'Long break is over. Let\'s start a new focus session!';
      }
      
      // Send notification via socket
      io.to(socketId).emit('notification', {
        type: 'pomodoro',
        title,
        message,
        mode: newMode, 
        sessionsCompleted,
        timestamp: Date.now()
      });
      
      // Also send a separate pomodoroCompleted event
      io.to(socketId).emit('pomodoroCompleted', {
        userId,
        previousMode: mode,
        newMode,
        sessionsCompleted,
        timestamp: Date.now()
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Pomodoro session completed',
      data: {
        mode: newMode,
        sessionsCompleted
      }
    });
  } catch (error) {
    console.error('Error completing pomodoro session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete pomodoro session'
    });
  }
});

// Resume a session
router.post('/resume', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing user ID'
      });
    }
    
    // Get session from memory
    const sessionData = activeSessions.get(userId);
    
    if (!sessionData) {
      return res.status(404).json({
        success: false,
        error: 'No active session found for this user'
      });
    }
    
    // Return the session data
    res.status(200).json({
      success: true,
      data: sessionData
    });
  } catch (error) {
    console.error('Error resuming pomodoro session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resume pomodoro session'
    });
  }
});

// Clean up stale sessions - can be called periodically or by a scheduled job
router.post('/cleanup', async (req, res) => {
  try {
    const now = Date.now();
    let cleanedCount = 0;
    
    // Check all sessions for staleness (24 hours without updates)
    for (const [userId, session] of activeSessions.entries()) {
      if (!session.lastUpdated || now - session.lastUpdated > 24 * 60 * 60 * 1000) {
        activeSessions.delete(userId);
        cleanedCount++;
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Cleaned up ${cleanedCount} stale sessions`,
      data: {
        cleanedCount,
        remainingCount: activeSessions.size
      }
    });
  } catch (error) {
    console.error('Error cleaning up pomodoro sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clean up stale sessions'
    });
  }
});

module.exports = router; 