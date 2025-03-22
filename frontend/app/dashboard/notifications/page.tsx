"use client"

import { NotificationsView } from "@/components/notifications-view"
import { useNotifications } from "@/hooks/use-notifications"
import { useToast } from "@/hooks/use-toast"

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
  const { toast } = useToast()

  const handleMarkAllAsRead = () => {
    markAllAsRead()
    toast({
      title: "All notifications marked as read",
      duration: 3000,
    })
  }

  return (
    <NotificationsView
      notifications={notifications}
      onMarkAsRead={markAsRead}
      onMarkAllAsRead={handleMarkAllAsRead}
      onDeleteNotification={deleteNotification}
    />
  )
}

