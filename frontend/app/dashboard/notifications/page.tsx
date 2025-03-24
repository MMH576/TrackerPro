"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { NotificationsView } from '@/components/notifications-view'
import { useEffect } from 'react'
import { useNotificationStore } from '@/lib/stores/notification-store'
import { supabase } from '@/lib/supabase'
import { SocketClient } from '@/lib/socket-client'

export default function NotificationsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { fetchNotifications, addNotification } = useNotificationStore()
  
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        fetchNotifications(data.user.id)
      }
    }
    
    getCurrentUser()
  }, [fetchNotifications])
  
  // Create a test notification to demonstrate functionality
  const handleCreateTestNotification = async () => {
    setIsLoading(true)
    
    try {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        // Create a notification in Supabase using our store
        await addNotification({
          userId: data.user.id,
          message: 'This is a test notification',
          type: 'system',
          isRead: false,
          metadata: {
            name: 'System',
          }
        })
        
        // For real-time notification testing, we can emit a socket event
        const socket = SocketClient.getInstance().connectToSocket(data.user.id)
        SocketClient.getInstance().mockEmit(data.user.id, 'notification', {
          userId: data.user.id,
          message: 'This is a real-time test notification',
          type: 'reminder',
          isRead: false,
          metadata: {
            name: 'System'
          }
        })
      }
    } catch (error) {
      console.error('Failed to create test notification:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <Button 
          onClick={handleCreateTestNotification} 
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : 'Create Test Notification'}
        </Button>
      </div>
      
      <NotificationsView />
    </div>
  )
}

