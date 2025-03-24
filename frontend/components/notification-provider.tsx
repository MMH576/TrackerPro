'use client';

import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { useNotificationStore } from '@/lib/stores/notification-store';
import { supabase } from '@/lib/supabase';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { setupSocketListeners, removeSocketListeners, fetchNotifications } = useNotificationStore();
  
  useEffect(() => {
    // Set up authentication listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Fetch existing notifications
        fetchNotifications(session.user.id);
        
        // Set up socket listeners for new notifications
        setupSocketListeners(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        // Remove socket listeners
        removeSocketListeners();
      }
    });
    
    // Check for current session
    const checkCurrentSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        fetchNotifications(data.session.user.id);
        setupSocketListeners(data.session.user.id);
      }
    };
    
    checkCurrentSession();
    
    // Cleanup
    return () => {
      authListener?.subscription.unsubscribe();
      removeSocketListeners();
    };
  }, [fetchNotifications, setupSocketListeners, removeSocketListeners]);
  
  return (
    <>
      <Toaster 
        position="top-right" 
        expand={true}
        richColors
        closeButton
        toastOptions={{
          duration: 5000,
          className: 'notification-toast',
          classNames: {
            toast: 'group notification-toast',
            title: 'group-data-[type=success]:text-green-600 group-data-[type=error]:text-red-600',
          },
          style: {
            background: 'var(--background)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
          },
        }}
      />
      {children}
    </>
  );
} 