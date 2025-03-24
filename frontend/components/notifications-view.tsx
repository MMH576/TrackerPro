"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Bell, Calendar, Check, Clock, Settings, Trophy, Users } from "lucide-react"
import type { Notification } from "@/lib/types"
import { motion } from "framer-motion"
import { useNotificationStore, NotificationData } from "@/lib/stores/notification-store"
import { supabase } from "@/lib/supabase"

interface NotificationsViewProps {
  onDeleteNotification?: (id: string) => void;
}

export function NotificationsView({ onDeleteNotification }: NotificationsViewProps) {
  const [activeTab, setActiveTab] = useState("all")
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    fetchNotifications 
  } = useNotificationStore();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        fetchNotifications(data.user.id);
      }
    };
    
    getCurrentUser();
  }, [fetchNotifications]);

  // Handler for when a notification is marked as read
  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  }

  // Handler for when all notifications are marked as read
  const handleMarkAllAsRead = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      markAllAsRead(data.user.id);
    }
  }

  // Handler for when a notification is deleted
  const handleDeleteNotification = (id: string) => {
    deleteNotification(id);
    if (onDeleteNotification) {
      onDeleteNotification(id);
    }
  }

  const getFilteredNotifications = () => {
    switch (activeTab) {
      case "unread":
        return notifications.filter((n) => !n.isRead)
      case "reminders":
        return notifications.filter((n) => n.type === "reminder")
      case "social":
        return notifications.filter((n) => n.type === "social" || n.type === "friend")
      default:
        return notifications
    }
  }

  const groupNotificationsByDate = () => {
    const groups: Record<string, NotificationData[]> = {
      Today: [],
      Yesterday: [],
      "This Week": [],
      Earlier: [],
    }

    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    const todayStr = today.toDateString()
    const yesterdayStr = yesterday.toDateString()

    getFilteredNotifications().forEach((notification) => {
      const notifDate = new Date(notification.createdAt)
      const notifDateStr = notifDate.toDateString()

      if (notifDateStr === todayStr) {
        groups["Today"].push(notification)
      } else if (notifDateStr === yesterdayStr) {
        groups["Yesterday"].push(notification)
      } else if (notifDate >= weekAgo) {
        groups["This Week"].push(notification)
      } else {
        groups["Earlier"].push(notification)
      }
    })

    // Remove empty groups
    return Object.entries(groups).filter(([_, notifications]) => notifications.length > 0)
  }

  const getNotificationIcon = (notification: NotificationData) => {
    switch (notification.type) {
      case "reminder":
        return <Bell className="h-5 w-5" />
      case "achievement":
        return <Trophy className="h-5 w-5" />
      case "social":
        return <Users className="h-5 w-5" />
      case "streak":
        return <Clock className="h-5 w-5" />
      case "system":
        return <Calendar className="h-5 w-5" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const getNotificationColor = (notification: NotificationData) => {
    switch (notification.type) {
      case "reminder":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
      case "achievement":
        return "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300"
      case "social":
        return "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300"
      case "streak":
        return "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300"
      case "system":
        return "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300"
      default:
        return "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const groupedNotifications = groupNotificationsByDate()

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">Stay updated on your habits and friends</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
            <Check className="h-4 w-4" />
            Mark All as Read
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
            <span className="sr-only">Notification settings</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" className="relative">
            All
            {unreadCount > 0 && <Badge className="ml-2 bg-primary text-primary-foreground">{unreadCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
        </TabsList>

        {groupedNotifications.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center text-center p-4 gap-2">
                <Bell className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-medium">No notifications</h3>
                <p className="text-sm text-muted-foreground">You don't have any notifications yet.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          groupedNotifications.map(([date, notifications]) => (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>{date}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`flex items-start gap-4 p-4 ${!notification.isRead ? "bg-muted/50" : ""}`}
                        onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                      >
                        {notification.metadata?.avatar ? (
                          <Avatar className="h-10 w-10 border">
                            <AvatarImage src={notification.metadata.avatar} alt={notification.metadata.name || ''} />
                            <AvatarFallback>{notification.metadata.name?.charAt(0) || '?'}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${getNotificationColor(notification)}`}>
                            {getNotificationIcon(notification)}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              {notification.metadata?.name ? (
                                <p className={`font-medium ${!notification.isRead ? "" : "text-muted-foreground"}`}>
                                  <span className="font-semibold">{notification.metadata.name}</span> {notification.message}
                                </p>
                              ) : (
                                <p className={`font-medium ${!notification.isRead ? "" : "text-muted-foreground"}`}>
                                  {notification.message}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground">{formatTime(notification.createdAt)}</p>
                            </div>
                            {!notification.isRead && <Badge variant="default" className="rounded-full h-2 w-2 p-0" />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </Tabs>
    </div>
  )
}

