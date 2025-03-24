'use client';

import { supabase } from '@/lib/supabase';
import { SocketClient } from '@/lib/socket-client';
import { toast } from 'sonner';

// Helper function to create habit reminder notification
export async function createHabitReminderNotification(
  userId: string, 
  habitId: string, 
  habitName: string
) {
  try {
    // Create notification in database
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        message: `Time to track your habit: ${habitName}`,
        type: 'reminder',
        related_id: habitId,
        is_read: false,
        metadata: {
          name: 'Habit Reminder'
        }
      })
      .select()
      .single();
      
    if (error) throw error;
    
    // Create formatted notification for real-time event
    const notification = {
      id: data.id,
      userId: data.user_id,
      message: data.message,
      type: data.type,
      relatedId: data.related_id,
      isRead: false,
      metadata: data.metadata,
      createdAt: data.created_at
    };
    
    // Emit socket event for real-time notification
    const socketClient = SocketClient.getInstance();
    socketClient.emitNotification({
      userId,
      message: notification.message,
      type: notification.type as any,
      relatedId: notification.relatedId,
      metadata: notification.metadata
    });
    
    return notification;
  } catch (error) {
    console.error('Error creating habit reminder notification:', error);
    return null;
  }
}

// Helper function to create streak achievement notification
export async function createStreakNotification(
  userId: string, 
  habitId: string, 
  habitName: string, 
  streakCount: number
) {
  try {
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
      return null; // Don't create notification for non-milestone streaks
    }
    
    // Create notification in database
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        message,
        type: 'streak',
        related_id: habitId,
        is_read: false,
        metadata: {
          name: 'Streak Achievement',
          streakCount
        }
      })
      .select()
      .single();
      
    if (error) throw error;
    
    // Create formatted notification for real-time event
    const notification = {
      id: data.id,
      userId: data.user_id,
      message: data.message,
      type: data.type,
      relatedId: data.related_id,
      isRead: false,
      metadata: data.metadata,
      createdAt: data.created_at
    };
    
    // Emit socket event for real-time notification
    const socketClient = SocketClient.getInstance();
    socketClient.emitNotification({
      userId,
      message: notification.message,
      type: notification.type as any,
      relatedId: notification.relatedId,
      metadata: notification.metadata
    });
    
    // Show a toast for achievements
    toast(notification.message, {
      position: 'top-right',
      duration: 5000,
      icon: '🏆'
    });
    
    return notification;
  } catch (error) {
    console.error('Error creating streak notification:', error);
    return null;
  }
} 