'use client';

import { create } from 'zustand';
import { Socket } from 'socket.io-client';
import { supabase } from '@/lib/supabase';
import { SocketClient, NotificationData as SocketNotificationData } from '@/lib/socket-client';
import { toast } from 'sonner';

export interface NotificationData {
  id: string;
  userId: string;
  message: string;
  type: 'reminder' | 'achievement' | 'social' | 'streak' | 'system' | 'friend';
  relatedId?: string;
  isRead: boolean;
  metadata?: {
    name?: string;
    avatar?: string;
    [key: string]: any;
  };
  createdAt: string;
}

interface NotificationState {
  notifications: NotificationData[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  
  // Socket events
  setupSocketListeners: (userId: string) => void;
  removeSocketListeners: () => void;
  
  // Adding a new notification manually (for testing)
  addNotification: (notification: Omit<NotificationData, 'id' | 'createdAt'>) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  
  fetchNotifications: async (userId: string) => {
    try {
      // Don't attempt to fetch if no userId is provided
      if (!userId) {
        console.log('No userId provided, skipping notification fetch');
        return;
      }

      set({ isLoading: true, error: null });
      
      const apiUrl = `${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}/api/notifications/${userId}`;
      console.log('Fetching notifications from:', apiUrl);
      
      const MAX_RETRIES = 3;
      const RETRY_DELAY = 1000;

      async function fetchWithRetry(url: string, retries = 0) {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error ${response.status}: ${errorText}`);
          }
          return await response.json();
        } catch (error) {
          if (retries < MAX_RETRIES) {
            console.log(`Retry attempt ${retries + 1} in ${RETRY_DELAY}ms`);
            await new Promise(r => setTimeout(r, RETRY_DELAY));
            return fetchWithRetry(url, retries + 1);
          }
          throw error;
        }
      }

      const data = await fetchWithRetry(apiUrl);
      set({ 
        notifications: data, 
        unreadCount: data.filter((n: NotificationData) => !n.isRead).length,
        isLoading: false 
      });
    } catch (error) {
      console.error('Error details:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : String(error),
        notifications: [], // Set empty array to prevent undefined errors
        unreadCount: 0
      });
    }
  },
  
  markAsRead: async (id: string) => {
    try {
      // Optimistic update
      set((state) => {
        const updatedNotifications = state.notifications.map((notification) =>
          notification.id === id ? { ...notification, isRead: true } : notification
        );
        
        return {
          notifications: updatedNotifications,
          unreadCount: state.unreadCount - 1 >= 0 ? state.unreadCount - 1 : 0
        };
      });
      
      // Update in Supabase
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert optimistic update if there's an error
      get().fetchNotifications(get().notifications[0]?.userId);
    }
  },
  
  markAllAsRead: async (userId: string) => {
    try {
      // Optimistic update
      set((state) => ({
        notifications: state.notifications.map((notification) => ({
          ...notification,
          isRead: true
        })),
        unreadCount: 0
      }));
      
      // Update in Supabase
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // Revert optimistic update if there's an error
      get().fetchNotifications(userId);
    }
  },
  
  deleteNotification: async (id: string) => {
    try {
      // Optimistic update
      set((state) => {
        const notification = state.notifications.find((n) => n.id === id);
        const isUnread = notification && !notification.isRead;
        
        return {
          notifications: state.notifications.filter((n) => n.id !== id),
          unreadCount: isUnread ? state.unreadCount - 1 : state.unreadCount
        };
      });
      
      // Delete from Supabase
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting notification:', error);
      // Revert optimistic update if there's an error
      get().fetchNotifications(get().notifications[0]?.userId);
    }
  },
  
  setupSocketListeners: (userId: string) => {
    const socket = SocketClient.getInstance().connectToSocket(userId);
    
    // Add notification event listener
    socket.on('notification', (data: any) => {
      const notificationData: NotificationData = {
        id: data.id || Date.now().toString(),
        userId: data.userId,
        message: data.message,
        type: data.type,
        relatedId: data.relatedId,
        isRead: false,
        metadata: data.metadata,
        createdAt: new Date().toISOString()
      };
      
      // Add to state
      set((state) => ({
        notifications: [notificationData, ...state.notifications],
        unreadCount: state.unreadCount + 1
      }));
      
      // Show toast notification
      toast(notificationData.message, {
        position: 'top-right',
        duration: 5000,
        icon: getNotificationIcon(notificationData.type),
        action: {
          label: 'View',
          onClick: () => {
            // Navigate to relevant page based on notification type
            if (notificationData.relatedId && notificationData.type === 'reminder') {
              window.location.href = `/habits/${notificationData.relatedId}`;
            } else {
              window.location.href = '/notifications';
            }
          }
        }
      });
    });
  },
  
  removeSocketListeners: () => {
    const socketInstance = SocketClient.getInstance();
    const sockets = socketInstance.getAllSockets();
    // Get all sockets and remove notification listener
    sockets.forEach((socket: Socket) => {
      socket.off('notification');
    });
  },
  
  addNotification: async (notification: Omit<NotificationData, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: notification.userId,
          message: notification.message,
          type: notification.type,
          related_id: notification.relatedId,
          is_read: notification.isRead,
          metadata: notification.metadata
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Add to state
      const formattedNotification = {
        id: data.id,
        userId: data.user_id,
        message: data.message,
        type: data.type,
        relatedId: data.related_id,
        isRead: data.is_read,
        metadata: data.metadata,
        createdAt: data.created_at
      };
      
      set((state) => ({
        notifications: [formattedNotification, ...state.notifications],
        unreadCount: !formattedNotification.isRead ? state.unreadCount + 1 : state.unreadCount
      }));
    } catch (error) {
      console.error('Error adding notification:', error);
      set({ error: 'Failed to add notification' });
    }
  }
}));

// Helper function to get notification icon based on type
function getNotificationIcon(type: string) {
  switch (type) {
    case 'reminder':
      return '⏰';
    case 'achievement':
      return '🏆';
    case 'social':
      return '👥';
    case 'streak':
      return '🔥';
    case 'system':
      return '💬';
    case 'friend':
      return '👋';
    default:
      return '📣';
  }
} 