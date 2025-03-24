'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNotificationStore } from '@/lib/stores/notification-store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

export function NotificationButton() {
  const { notifications, unreadCount, markAsRead } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);

  // Take only the first 5 unread notifications
  const recentNotifications = notifications
    .filter(notification => !notification.isRead)
    .slice(0, 5);

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && <Badge variant="outline">{unreadCount} unread</Badge>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {recentNotifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <p>No unread notifications</p>
          </div>
        ) : (
          <>
            {recentNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex gap-2 cursor-pointer p-2"
                onClick={() => handleNotificationClick(notification.id)}
              >
                {notification.metadata?.avatar ? (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={notification.metadata.avatar} alt={notification.metadata.name || ''} />
                    <AvatarFallback>{notification.metadata.name?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bell className="h-4 w-4" />
                  </div>
                )}
                <div className="flex-1 text-sm">
                  <p className="font-medium">
                    {notification.metadata?.name && (
                      <span className="font-semibold">{notification.metadata.name} </span>
                    )}
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatTime(notification.createdAt)}</p>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="justify-center text-primary">
              <Link href="/dashboard/notifications">
                View all notifications
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 