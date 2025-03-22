'use client';

import { useState, useEffect } from 'react';

// Temporary notification type
type Notification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

// Mock notifications for development
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Streak Achievement',
    message: 'Congratulations! You completed your meditation habit for 7 days in a row!',
    read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: '2',
    title: 'Reminder',
    message: "Don't forget to complete your daily exercise habit!",
    read: true,
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Simulate API fetch in development mode
    const loadNotifications = async () => {
      try {
        setLoading(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setNotifications(MOCK_NOTIFICATIONS);
        calculateUnreadCount(MOCK_NOTIFICATIONS);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load notifications'));
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  const calculateUnreadCount = (notifs: Notification[]) => {
    setUnreadCount(notifs.filter(n => !n.read).length);
  };

  const markAsRead = async (id: string) => {
    try {
      setLoading(true);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const updatedNotifications = notifications.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      );
      
      setNotifications(updatedNotifications);
      calculateUnreadCount(updatedNotifications);
      
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to mark notification as read');
      setError(error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const updatedNotifications = notifications.map(notification => ({ ...notification, read: true }));
      
      setNotifications(updatedNotifications);
      setUnreadCount(0);
      
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to mark all notifications as read');
      setError(error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      setLoading(true);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const updatedNotifications = notifications.filter(notification => notification.id !== id);
      
      setNotifications(updatedNotifications);
      calculateUnreadCount(updatedNotifications);
      
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete notification');
      setError(error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
} 