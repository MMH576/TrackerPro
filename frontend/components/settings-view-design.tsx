import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Bell, Calendar, Cloud, Lock, Moon, Shield, Sun, User } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

export function SettingsViewDesign() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="preferences" className="space-y-4">
        <TabsList>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how Habit Tracker Pro looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex items-center space-x-4">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Sun className="h-4 w-4" />
                    Light
                  </Button>
                  <Button variant="default" size="sm" className="gap-2">
                    <Moon className="h-4 w-4" />
                    Dark
                  </Button>
                  <Button variant="outline" size="sm">
                    System
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="week-start">Week Starts On</Label>
                <Select defaultValue="1">
                  <SelectTrigger id="week-start">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compact-view">Compact View</Label>
                  <p className="text-sm text-muted-foreground">Display more habits on screen</p>
                </div>
                <Switch id="compact-view" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="animations">Animations</Label>
                  <p className="text-sm text-muted-foreground">Enable animations and transitions</p>
                </div>
                <Switch id="animations" defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Habit Defaults</CardTitle>
              <CardDescription>Set default values for new habits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="default-reminder">Default Reminder Time</Label>
                <Input id="default-reminder" type="time" defaultValue="20:00" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="default-category">Default Category</Label>
                <Select defaultValue="health">
                  <SelectTrigger id="default-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="health">Health & Fitness</SelectItem>
                    <SelectItem value="learning">Learning</SelectItem>
                    <SelectItem value="productivity">Productivity</SelectItem>
                    <SelectItem value="mindfulness">Mindfulness</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Reminders
              </CardTitle>
              <CardDescription>Configure when and how you receive reminders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="reminder-toggle">Daily Reminders</Label>
                  <p className="text-sm text-muted-foreground">Receive a daily reminder to complete your habits</p>
                </div>
                <Switch id="reminder-toggle" defaultChecked />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminder-time">Reminder Time</Label>
                <div className="flex items-center gap-2">
                  <Input id="reminder-time" type="time" defaultValue="20:00" className="w-32" />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="streak-alerts">Streak Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified when you're about to break a streak</p>
                </div>
                <Switch id="streak-alerts" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="achievement-alerts">Achievement Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified when you earn achievements</p>
                </div>
                <Switch id="achievement-alerts" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="friend-alerts">Friend Activity</Label>
                  <p className="text-sm text-muted-foreground">Get notified about friend challenges and activities</p>
                </div>
                <Switch id="friend-alerts" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Google Calendar
              </CardTitle>
              <CardDescription>Sync your habits with Google Calendar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="calendar-sync">Calendar Sync</Label>
                  <p className="text-sm text-muted-foreground">Add your habits to your Google Calendar</p>
                </div>
                <Switch id="calendar-sync" />
              </div>

              <div className="rounded-md bg-muted p-4">
                <p className="text-sm">
                  Connect your Google Calendar to see your habits as events and get reminders directly in your calendar.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                Connect Google Calendar
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Other Integrations
              </CardTitle>
              <CardDescription>Connect with other services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Apple Health", connected: true, icon: "🍎" },
                  { name: "Fitbit", connected: false, icon: "⌚" },
                  { name: "Spotify", connected: false, icon: "🎵" },
                  { name: "Todoist", connected: true, icon: "✓" },
                ].map((integration, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <span className="text-lg">{integration.icon}</span>
                      </div>
                      <div>
                        <p className="font-medium">{integration.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {integration.connected ? "Connected" : "Not connected"}
                        </p>
                      </div>
                    </div>
                    <Button variant={integration.connected ? "outline" : "default"} size="sm">
                      {integration.connected ? "Disconnect" : "Connect"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </CardTitle>
              <CardDescription>Manage your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue="Alex Johnson" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="alex@example.com" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Profile Picture</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="/placeholder.svg?height=48&width=48" alt="User" />
                    <AvatarFallback>AJ</AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm">
                    Change
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Save Changes</Button>
            </CardFooter>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Password
                </CardTitle>
                <CardDescription>Update your password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Update Password</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy
                </CardTitle>
                <CardDescription>Manage your privacy settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="public-profile">Public Profile</Label>
                    <p className="text-sm text-muted-foreground">Allow others to see your profile</p>
                  </div>
                  <Switch id="public-profile" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="share-progress">Share Progress</Label>
                    <p className="text-sm text-muted-foreground">Share your habit progress with friends</p>
                  </div>
                  <Switch id="share-progress" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="analytics">Analytics</Label>
                    <p className="text-sm text-muted-foreground">Help improve the app with anonymous usage data</p>
                  </div>
                  <Switch id="analytics" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible account actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border border-destructive/50 p-4">
                <h4 className="font-medium text-destructive">Delete Account</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Permanently delete your account and all your data. This action cannot be undone.
                </p>
                <Button variant="destructive" size="sm" className="mt-4">
                  Delete Account
                </Button>
              </div>

              <div className="rounded-md border p-4">
                <h4 className="font-medium">Export Data</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Download all your habit data and account information.
                </p>
                <Button variant="outline" size="sm" className="mt-4">
                  Export Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

