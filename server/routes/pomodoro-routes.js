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
    const { userId, mode, timeLeft, isRunning, endTime, sessionsCompleted, settings, autoStarted } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing user ID'
      });
    }
    
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    
    // Get existing session or create new one
    const existingSession = activeSessions.get(userId) || {};
    
    // Update session in memory with new values while preserving any existing data
    const updatedSession = {
      ...existingSession,
      mode: mode || existingSession.mode,
      timeLeft: timeLeft !== undefined ? timeLeft : existingSession.timeLeft,
      isRunning: isRunning !== undefined ? isRunning : existingSession.isRunning,
      endTime: endTime || existingSession.endTime,
      sessionsCompleted: sessionsCompleted !== undefined ? sessionsCompleted : existingSession.sessionsCompleted,
      settings: settings || existingSession.settings,
      autoStarted: autoStarted !== undefined ? autoStarted : existingSession.autoStarted,
      lastUpdated: Date.now()
    };
    
    // Store the updated session
    activeSessions.set(userId, updatedSession);
    
    // Broadcast to all clients for real-time stats updates
    if (io) {
      io.emit('pomodoroStatsUpdate', {
        userId,
        mode: updatedSession.mode,
        sessionsCompleted: updatedSession.sessionsCompleted,
        isRunning: updatedSession.isRunning
      });
    }
    
    // Sync information to connected clients
    const socketId = connectedUsers.get(userId);
    if (socketId && io) {
      io.to(socketId).emit('pomodoroStateUpdate', {
        userId,
        mode: updatedSession.mode,
        timeLeft: updatedSession.timeLeft,
        isRunning: updatedSession.isRunning,
        endTime: updatedSession.endTime,
        sessionsCompleted: updatedSession.sessionsCompleted,
        settings: updatedSession.settings,
        autoStarted: updatedSession.autoStarted
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Pomodoro session updated',
      data: updatedSession
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
    const { userId, mode, newMode, sessionsCompleted, autoStart } = req.body;
    
    if (!userId || !mode || !newMode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    console.log(`Completing session for user ${userId}:`, { 
      mode, 
      newMode, 
      sessionsCompleted, 
      autoStart 
    });
    
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    const supabase = req.app.get('supabase');
    
    // Get session from memory
    const sessionData = activeSessions.get(userId);
    
    if (sessionData) {
      // Store the auto-start setting if provided
      if (autoStart !== undefined) {
        if (!sessionData.settings) {
          sessionData.settings = { autoStartEnabled: autoStart };
        } else {
          sessionData.settings.autoStartEnabled = autoStart;
        }
      }
      
      // Update session state
      sessionData.mode = newMode;
      sessionData.isRunning = autoStart === true; // Auto-start if specified
      sessionData.sessionsCompleted = sessionsCompleted;
      sessionData.lastUpdated = Date.now();
      sessionData.autoStarted = autoStart === true;
      
      // Reset timer based on new mode
      if (newMode === 'pomodoro') {
        const pomodoroTime = sessionData?.settings?.pomodoroTime || 25;
        sessionData.timeLeft = pomodoroTime * 60;
      } else if (newMode === 'shortBreak') {
        const shortBreakTime = sessionData?.settings?.shortBreakTime || 5;
        sessionData.timeLeft = shortBreakTime * 60;
      } else {
        const longBreakTime = sessionData?.settings?.longBreakTime || 15;
        sessionData.timeLeft = longBreakTime * 60;
      }
      
      // If auto-start is enabled, set a new end time
      if (autoStart === true) {
        sessionData.endTime = Date.now() + (sessionData.timeLeft * 1000);
        console.log(`Auto-starting timer for user ${userId} with end time:`, new Date(sessionData.endTime).toISOString());
      } else {
        sessionData.endTime = 0;
      }
      
      // Save updated session
      activeSessions.set(userId, sessionData);
      
      // Broadcast to all clients for real-time stats updates
      if (io) {
        io.emit('pomodoroStatsUpdate', {
          userId,
          mode: newMode,
          sessionsCompleted,
          isRunning: autoStart === true
        });
      }
    } else {
      console.log(`No existing session found for user ${userId}, creating new one`);
      
      // Create new session if one doesn't exist
      const newSessionData = {
        mode: newMode,
        isRunning: autoStart === true,
        sessionsCompleted: sessionsCompleted || 0,
        lastUpdated: Date.now(),
        autoStarted: autoStart === true,
        settings: {
          pomodoroTime: 25,
          shortBreakTime: 5,
          longBreakTime: 15,
          longBreakInterval: 4,
          autoStartEnabled: autoStart !== undefined ? autoStart : true
        }
      };
      
      // Set time based on mode
      if (newMode === 'pomodoro') {
        newSessionData.timeLeft = newSessionData.settings.pomodoroTime * 60;
      } else if (newMode === 'shortBreak') {
        newSessionData.timeLeft = newSessionData.settings.shortBreakTime * 60;
      } else {
        newSessionData.timeLeft = newSessionData.settings.longBreakTime * 60;
      }
      
      // Set end time if auto-starting
      if (autoStart === true) {
        newSessionData.endTime = Date.now() + (newSessionData.timeLeft * 1000);
      } else {
        newSessionData.endTime = 0;
      }
      
      // Save new session
      activeSessions.set(userId, newSessionData);
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
          session_number: sessionsCompleted,
          auto_started: sessionData?.autoStarted || false
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
          ? `Great job! ${autoStart ? 'Starting' : 'Time for'} a long break.` 
          : `Great job! ${autoStart ? 'Starting' : 'Time for'} a short break.`;
      } else if (mode === 'shortBreak') {
        title = 'Short Break Completed!';
        message = `Break time is over. ${autoStart ? 'Starting new focus session.' : 'Ready to focus again?'}`;
      } else if (mode === 'longBreak') {
        title = 'Long Break Completed!';
        message = `Long break is over. ${autoStart ? 'Starting new focus session.' : 'Let\'s start a new focus session!'}`;
      }
      
      // Send notification via socket
      io.to(socketId).emit('notification', {
        type: 'pomodoro',
        title,
        message,
        mode: newMode, 
        sessionsCompleted,
        autoStart,
        timestamp: Date.now()
      });
      
      // Also send a separate pomodoroCompleted event
      io.to(socketId).emit('pomodoroCompleted', {
        userId,
        previousMode: mode,
        newMode,
        sessionsCompleted,
        autoStart,
        timestamp: Date.now()
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Pomodoro session completed',
      data: {
        mode: newMode,
        sessionsCompleted,
        autoStart
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