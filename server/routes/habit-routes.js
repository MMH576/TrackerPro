const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { emitNotificationToUser } = require('../utils/socket');

// Create habit reminder notification
router.post('/reminder', async (req, res) => {
  try {
    const { userId, habitId, habitName } = req.body;
    
    if (!userId || !habitId || !habitName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create notification in database
    const { data, error } = await db.createNotification({
      userId,
      message: `Time to track your habit: ${habitName}`,
      type: 'reminder',
      relatedId: habitId,
      metadata: {
        name: 'Habit Reminder'
      }
    });
    
    if (error) throw error;
    
    // Get socket instance and emit notification
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    
    // Use socket utility to emit notification
    emitNotificationToUser(io, connectedUsers, userId, data);
    
    return res.status(201).json(data);
  } catch (error) {
    console.error('Error creating habit reminder notification:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create streak achievement notification
router.post('/streak', async (req, res) => {
  try {
    const { userId, habitId, habitName, streakCount } = req.body;
    
    if (!userId || !habitId || !habitName || !streakCount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Determine message based on streak count
    let message = '';
    if (streakCount === 7) {
      message = `You reached a 7-day streak for "${habitName}"! Keep it up!`;
    } else if (streakCount === 30) {
      message = `Amazing! 30-day streak for "${habitName}"! You're on fire!`;
    } else if (streakCount === 100) {
      message = `Incredible! 100-day streak for "${habitName}"! You're a habit master!`;
    } else if (streakCount % 10 === 0) {
      message = `You reached a ${streakCount}-day streak for "${habitName}"!`;
    } else {
      return res.status(400).json({ error: 'Invalid streak count for notification' });
    }
    
    // Create notification in database
    const { data, error } = await db.createNotification({
      userId,
      message,
      type: 'streak',
      relatedId: habitId,
      metadata: {
        name: 'Streak Achievement',
        streakCount
      }
    });
    
    if (error) throw error;
    
    // Get socket instance and emit notification
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    
    // Use socket utility to emit notification
    emitNotificationToUser(io, connectedUsers, userId, data);
    
    return res.status(201).json(data);
  } catch (error) {
    console.error('Error creating streak notification:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 