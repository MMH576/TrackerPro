const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Get notifications for a user
async function getUserNotifications(userId) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Database error getting user notifications:', error);
    return { data: null, error };
  }
}

// Create a notification
async function createNotification(notificationData) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: notificationData.userId,
        message: notificationData.message,
        type: notificationData.type,
        related_id: notificationData.relatedId || null,
        is_read: false,
        metadata: notificationData.metadata || null
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Database error creating notification:', error);
    return { data: null, error };
  }
}

// Mark notification as read
async function markNotificationAsRead(notificationId) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Database error marking notification as read:', error);
    return { data: null, error };
  }
}

// Mark all notifications as read for a user
async function markAllNotificationsAsRead(userId) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select();
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Database error marking all notifications as read:', error);
    return { data: null, error };
  }
}

// Delete notification
async function deleteNotification(notificationId) {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
      
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Database error deleting notification:', error);
    return { success: false, error };
  }
}

// Get unread notification count for a user
async function getUnreadNotificationCount(userId) {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
      
    if (error) throw error;
    
    return { count, error: null };
  } catch (error) {
    console.error('Database error getting unread notification count:', error);
    return { count: 0, error };
  }
}

module.exports = {
  supabase,
  getUserNotifications,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationCount
}; 