import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Bell, Calendar, Check, Clock, Settings, Trophy, Users } from "lucide-react"

export function NotificationsViewDesign() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">Stay updated on your habits and friends</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Check className="h-4 w-4" />
            Mark All as Read
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
            <span className="sr-only">Notification settings</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            <Badge className="ml-2 bg-primary text-primary-foreground" variant="default">
              3
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {[
                  {
                    icon: <Bell className="h-5 w-5" />,
                    title: "Reminder: Complete your Evening Meditation",
                    time: "Just now",
                    unread: true,
                    color: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
                  },
                  {
                    icon: <Trophy className="h-5 w-5" />,
                    title: "You've earned the 'Perfect Week' achievement!",
                    time: "2 hours ago",
                    unread: true,
                    color: "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300",
                  },
                  {
                    icon: <Users className="h-5 w-5" />,
                    title: "Sarah Chen invited you to the '30-Day Fitness' challenge",
                    time: "5 hours ago",
                    unread: true,
                    color: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300",
                  },
                ].map((notification, index) => (
                  <div key={index} className={`flex items-start gap-4 p-4 ${notification.unread ? "bg-muted/50" : ""}`}>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${notification.color}`}>
                      {notification.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`font-medium ${notification.unread ? "" : "text-muted-foreground"}`}>
                            {notification.title}
                          </p>
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

          <Card>
            <CardHeader>
              <CardTitle>Yesterday</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {[
                  {
                    icon: <Clock className="h-5 w-5" />,
                    title: "You're on a 7-day streak for Morning Meditation!",
                    time: "Yesterday at 9:30 AM",
                    unread: false,
                    color: "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300",
                  },
                  {
                    icon: <Calendar className="h-5 w-5" />,
                    title: "Your Google Calendar has been successfully connected",
                    time: "Yesterday at 2:15 PM",
                    unread: false,
                    color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300",
                  },
                ].map((notification, index) => (
                  <div key={index} className={`flex items-start gap-4 p-4 ${notification.unread ? "bg-muted/50" : ""}`}>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${notification.color}`}>
                      {notification.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`font-medium ${notification.unread ? "" : "text-muted-foreground"}`}>
                            {notification.title}
                          </p>
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

          <Card>
            <CardHeader>
              <CardTitle>This Week</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {[
                  {
                    icon: <Users className="h-5 w-5" />,
                    title: "Michael Kim completed the 'Reading Challenge'",
                    time: "Monday at 8:45 PM",
                    unread: false,
                    color: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300",
                  },
                  {
                    icon: <Trophy className="h-5 w-5" />,
                    title: "You've earned the 'Streak Master' achievement!",
                    time: "Monday at 10:30 AM",
                    unread: false,
                    color: "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300",
                  },
                  {
                    avatar: "/placeholder.svg?height=40&width=40",
                    name: "Jessica Taylor",
                    title: "started following you",
                    time: "Sunday at 3:20 PM",
                    unread: false,
                  },
                ].map((notification, index) => (
                  <div key={index} className={`flex items-start gap-4 p-4 ${notification.unread ? "bg-muted/50" : ""}`}>
                    {"avatar" in notification ? (
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage src={notification.avatar} alt={notification.name} />
                        <AvatarFallback>{notification.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${notification.color}`}>
                        {notification.icon}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          {"name" in notification ? (
                            <p className={`font-medium ${notification.unread ? "" : "text-muted-foreground"}`}>
                              <span className="font-semibold">{notification.name}</span> {notification.title}
                            </p>
                          ) : (
                            <p className={`font-medium ${notification.unread ? "" : "text-muted-foreground"}`}>
                              {notification.title}
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
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unread Notifications</CardTitle>
              <CardDescription>You have 3 unread notifications</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {[
                  {
                    icon: <Bell className="h-5 w-5" />,
                    title: "Reminder: Complete your Evening Meditation",
                    time: "Just now",
                    unread: true,
                    color: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
                  },
                  {
                    icon: <Trophy className="h-5 w-5" />,
                    title: "You've earned the 'Perfect Week' achievement!",
                    time: "2 hours ago",
                    unread: true,
                    color: "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300",
                  },
                  {
                    icon: <Users className="h-5 w-5" />,
                    title: "Sarah Chen invited you to the '30-Day Fitness' challenge",
                    time: "5 hours ago",
                    unread: true,
                    color: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300",
                  },
                ].map((notification, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-muted/50">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${notification.color}`}>
                      {notification.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{notification.title}</p>
                          <p className="text-sm text-muted-foreground">{notification.time}</p>
                        </div>
                        <Badge variant="default" className="rounded-full h-2 w-2 p-0" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reminders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Habit Reminders</CardTitle>
              <CardDescription>Notifications about your habits</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {[
                  {
                    icon: <Bell className="h-5 w-5" />,
                    title: "Reminder: Complete your Evening Meditation",
                    time: "Just now",
                    unread: true,
                    color: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
                  },
                  {
                    icon: <Clock className="h-5 w-5" />,
                    title: "You're on a 7-day streak for Morning Meditation!",
                    time: "Yesterday at 9:30 AM",
                    unread: false,
                    color: "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300",
                  },
                  {
                    icon: <Bell className="h-5 w-5" />,
                    title: "Reminder: Time to drink water",
                    time: "Monday at 2:00 PM",
                    unread: false,
                    color: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
                  },
                  {
                    icon: <Bell className="h-5 w-5" />,
                    title: "Reminder: Time to exercise",
                    time: "Sunday at 5:30 PM",
                    unread: false,
                    color: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
                  },
                ].map((notification, index) => (
                  <div key={index} className={`flex items-start gap-4 p-4 ${notification.unread ? "bg-muted/50" : ""}`}>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${notification.color}`}>
                      {notification.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`font-medium ${notification.unread ? "" : "text-muted-foreground"}`}>
                            {notification.title}
                          </p>
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
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Social Notifications</CardTitle>
              <CardDescription>Updates from friends and challenges</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {[
                  {
                    icon: <Users className="h-5 w-5" />,
                    title: "Sarah Chen invited you to the '30-Day Fitness' challenge",
                    time: "5 hours ago",
                    unread: true,
                    color: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300",
                  },
                  {
                    icon: <Users className="h-5 w-5" />,
                    title: "Michael Kim completed the 'Reading Challenge'",
                    time: "Monday at 8:45 PM",
                    unread: false,
                    color: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300",
                  },
                  {
                    avatar: "/placeholder.svg?height=40&width=40",
                    name: "Jessica Taylor",
                    title: "started following you",
                    time: "Sunday at 3:20 PM",
                    unread: false,
                  },
                  {
                    avatar: "/placeholder.svg?height=40&width=40",
                    name: "David Wilson",
                    title: "commented on your progress",
                    time: "Saturday at 11:15 AM",
                    unread: false,
                  },
                ].map((notification, index) => (
                  <div key={index} className={`flex items-start gap-4 p-4 ${notification.unread ? "bg-muted/50" : ""}`}>
                    {"avatar" in notification ? (
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage src={notification.avatar} alt={notification.name} />
                        <AvatarFallback>{notification.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${notification.color}`}>
                        {notification.icon}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          {"name" in notification ? (
                            <p className={`font-medium ${notification.unread ? "" : "text-muted-foreground"}`}>
                              <span className="font-semibold">{notification.name}</span> {notification.title}
                            </p>
                          ) : (
                            <p className={`font-medium ${notification.unread ? "" : "text-muted-foreground"}`}>
                              {notification.title}
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
        </TabsContent>
      </Tabs>
    </div>
  )
}

