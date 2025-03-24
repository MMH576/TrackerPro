const express = require('express');
const router = express.Router();
const { formatNotificationForClient, emitNotificationToUser } = require('../utils/socket');

// Get all notifications for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const supabase = req.app.get('supabase');
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new notification
router.post('/', async (req, res) => {
  try {
    const { userId, message, type, relatedId, metadata } = req.body;
    const supabase = req.app.get('supabase');
    
    console.log('Creating notification:', { userId, message, type, relatedId, metadata });
    
    if (!userId || !message || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        message,
        type,
        related_id: relatedId || null,
        is_read: false,
        metadata: metadata || null
      })
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    console.log('Notification created:', data);
    
    // Get socket instance and emit notification
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    
    // Use socket utility to emit notification
    emitNotificationToUser(io, connectedUsers, userId, data);
    
    return res.status(201).json(data);
  } catch (error) {
    console.error('Error creating notification:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Mark notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = req.app.get('supabase');
    
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark all notifications as read for a user
router.patch('/read-all/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const supabase = req.app.get('supabase');
    
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select();
      
    if (error) throw error;
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = req.app.get('supabase');
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unread notification count for a user
router.get('/unread/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const supabase = req.app.get('supabase');
    
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
      
    if (error) throw error;
    
    return res.status(200).json({ count });
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 