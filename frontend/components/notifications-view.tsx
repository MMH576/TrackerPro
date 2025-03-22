"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Bell, Calendar, Check, Clock, Settings, Trophy, Users } from "lucide-react"
import type { Notification } from "@/lib/types"
import { motion } from "framer-motion"

interface NotificationsViewProps {
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onDeleteNotification: (id: string) => void
}

export function NotificationsView({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
}: NotificationsViewProps) {
  const [activeTab, setActiveTab] = useState("all")

  const getFilteredNotifications = () => {
    switch (activeTab) {
      case "unread":
        return notifications.filter((n) => n.unread)
      case "reminders":
        return notifications.filter((n) => n.type === "reminder")
      case "social":
        return notifications.filter((n) => n.type === "social" || n.type === "friend")
      default:
        return notifications
    }
  }

  const getUnreadCount = () => {
    return notifications.filter((n) => n.unread).length
  }

  const groupNotificationsByDate = () => {
    const groups: Record<string, Notification[]> = {
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
      const notifDate = new Date(notification.timestamp)
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

  const handleMarkAsRead = (id: string) => {
    onMarkAsRead(id)
  }

  const getNotificationIcon = (notification: Notification) => {
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

  const getNotificationColor = (notification: Notification) => {
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

  const groupedNotifications = groupNotificationsByDate()
  const unreadCount = getUnreadCount()

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">Stay updated on your habits and friends</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={onMarkAllAsRead} disabled={unreadCount === 0}>
            <Check className="h-4 w-4" />
            Mark All as Read
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
            <span className="sr-only">Notification settings</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex overflow-x-auto pb-px">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-primary text-primary-foreground" variant="default">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
        </TabsList>

        {getFilteredNotifications().length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-4xl mb-4">🔔</div>
            <h3 className="text-xl font-medium mb-2">No notifications</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {activeTab === "all"
                ? "You don't have any notifications yet."
                : activeTab === "unread"
                  ? "You don't have any unread notifications."
                  : activeTab === "reminders"
                    ? "You don't have any reminder notifications."
                    : "You don't have any social notifications."}
            </p>
          </div>
        ) : (
          groupedNotifications.map(([date, notifications]) => (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>{date}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`flex items-start gap-4 p-4 ${notification.unread ? "bg-muted/50" : ""}`}
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        {"avatar" in notification ? (
                          <Avatar className="h-10 w-10 border">
                            <AvatarImage src={notification.avatar} alt={notification.name} />
                            <AvatarFallback>{notification.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full ${getNotificationColor(notification)}`}
                          >
                            {getNotificationIcon(notification)}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              {"name" in notification ? (
                                <p className={`font-medium ${notification.unread ? "" : "text-muted-foreground"}`}>
                                  <span className="font-semibold">{notification.name}</span> {notification.message}
                                </p>
                              ) : (
                                <p className={`font-medium ${notification.unread ? "" : "text-muted-foreground"}`}>
                                  {notification.message}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground">{notification.time}</p>
                            </div>
                            {notification.unread && <Badge variant="default" className="rounded-full h-2 w-2 p-0" />}
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

