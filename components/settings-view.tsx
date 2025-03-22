"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, Calendar, Cloud, Lock, Moon, Shield, Sun, User } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import type { User as UserType } from "@/lib/types"

interface SettingsViewProps {
  user: UserType
  onUpdatePreferences: (preferences: Partial<UserType["preferences"]>) => void
  onUpdateProfile: (profile: Partial<UserType>) => void
  onUpdatePassword: (currentPassword: string, newPassword: string) => void
}

export function SettingsView({ user, onUpdatePreferences, onUpdateProfile, onUpdatePassword }: SettingsViewProps) {
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState("preferences")

  // Form states
  const [profile, setProfile] = useState({
    name: user.name,
    email: user.email,
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [reminderTime, setReminderTime] = useState(user.preferences.reminderTime)
  const [missedReminderTime, setMissedReminderTime] = useState("21:00")

  // Handle profile update
  const handleProfileUpdate = () => {
    onUpdateProfile({
      name: profile.name,
      email: profile.email,
    })
  }

  // Handle password update
  const handlePasswordUpdate = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Passwords don't match")
      return
    }

    onUpdatePassword(passwordForm.currentPassword, passwordForm.newPassword)

    // Reset form
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
  }

  // Handle reminder time change
  const handleReminderTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReminderTime(e.target.value)
  }

  // Save reminder time
  const saveReminderTime = () => {
    onUpdatePreferences({ reminderTime })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex overflow-x-auto pb-px">
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how Habit Tracker Pro looks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <div className="flex items-center space-x-4">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      size="sm"
                      className="gap-2"
                      onClick={() => setTheme("light")}
                    >
                      <Sun className="h-4 w-4" />
                      Light
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      size="sm"
                      className="gap-2"
                      onClick={() => setTheme("dark")}
                    >
                      <Moon className="h-4 w-4" />
                      Dark
                    </Button>
                    <Button
                      variant={theme === "system" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("system")}
                    >
                      System
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="week-start">Week Starts On</Label>
                  <Select
                    value={user.preferences.weekStartsOn.toString()}
                    onValueChange={(value) => onUpdatePreferences({ weekStartsOn: Number.parseInt(value) })}
                  >
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
                  <Switch
                    id="compact-view"
                    checked={user.preferences.compactView}
                    onCheckedChange={(checked) => onUpdatePreferences({ compactView: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="animations">Animations</Label>
                    <p className="text-sm text-muted-foreground">Enable animations and transitions</p>
                  </div>
                  <Switch
                    id="animations"
                    checked={user.preferences.animations}
                    onCheckedChange={(checked) => onUpdatePreferences({ animations: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Habit Defaults</CardTitle>
                <CardDescription>Set default values for new habits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="default-reminder">Default Reminder Time</Label>
                  <Input
                    id="default-reminder"
                    type="time"
                    value={user.preferences.defaultReminderTime}
                    onChange={(e) => onUpdatePreferences({ defaultReminderTime: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="default-category">Default Category</Label>
                  <Select
                    value={user.preferences.defaultCategory}
                    onValueChange={(value) => onUpdatePreferences({ defaultCategory: value })}
                  >
                    <SelectTrigger id="default-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="health">Health & Fitness</SelectItem>
                      <SelectItem value="learning">Learning</SelectItem>
                      <SelectItem value="productivity">Productivity</SelectItem>
                      <SelectItem value="mindfulness">Mindfulness</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="creativity">Creativity</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
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
                  <Switch
                    id="reminder-toggle"
                    checked={user.preferences.reminderEnabled}
                    onCheckedChange={(checked) => onUpdatePreferences({ reminderEnabled: checked })}
                  />
                </div>

                {user.preferences.reminderEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="reminder-time">Reminder Time</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="reminder-time"
                        type="time"
                        value={reminderTime}
                        onChange={handleReminderTimeChange}
                        className="w-32"
                      />
                      <Button size="sm" onClick={saveReminderTime}>
                        Save
                      </Button>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="streak-alerts">Streak Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified when you're about to break a streak</p>
                  </div>
                  <Switch
                    id="streak-alerts"
                    checked={user.preferences.streakAlerts}
                    onCheckedChange={(checked) => onUpdatePreferences({ streakAlerts: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="achievement-alerts">Achievement Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified when you earn achievements</p>
                  </div>
                  <Switch
                    id="achievement-alerts"
                    checked={user.preferences.achievementAlerts}
                    onCheckedChange={(checked) => onUpdatePreferences({ achievementAlerts: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="friend-alerts">Friend Activity</Label>
                    <p className="text-sm text-muted-foreground">Get notified about friend challenges and activities</p>
                  </div>
                  <Switch
                    id="friend-alerts"
                    checked={user.preferences.friendAlerts}
                    onCheckedChange={(checked) => onUpdatePreferences({ friendAlerts: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="missed-reminder">Missed Habit Reminder</Label>
                    <p className="text-sm text-muted-foreground">Get a reminder if you haven't completed the habit</p>
                  </div>
                  <Switch id="missed-reminder" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="missed-time">Reminder Time</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="missed-time"
                      type="time"
                      value={missedReminderTime}
                      onChange={(e) => setMissedReminderTime(e.target.value)}
                      className="w-32"
                    />
                    <Button size="sm">Save</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
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
                  <Switch
                    id="calendar-sync"
                    checked={user.preferences.calendarSync}
                    onCheckedChange={(checked) => onUpdatePreferences({ calendarSync: checked })}
                  />
                </div>

                {user.preferences.calendarSync ? (
                  <div className="rounded-md bg-muted p-4">
                    <p className="text-sm">
                      Your habits will appear as events in your Google Calendar. You can edit the calendar settings in
                      your Google account.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md bg-muted p-4">
                    <p className="text-sm">
                      Connect your Google Calendar to see your habits as events and get reminders directly in your
                      calendar.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                {!user.preferences.calendarSync && (
                  <Button variant="outline" className="w-full">
                    Connect Google Calendar
                  </Button>
                )}
              </CardFooter>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
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
          </motion.div>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
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
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Profile Picture</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm">
                      Change
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleProfileUpdate}>
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
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
                    <Input
                      id="current-password"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={handlePasswordUpdate}
                    disabled={
                      !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword
                    }
                  >
                    Update Password
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
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
                    <Switch
                      id="public-profile"
                      checked={user.preferences.publicProfile}
                      onCheckedChange={(checked) => onUpdatePreferences({ publicProfile: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="share-progress">Share Progress</Label>
                      <p className="text-sm text-muted-foreground">Share your habit progress with friends</p>
                    </div>
                    <Switch
                      id="share-progress"
                      checked={user.preferences.shareProgress}
                      onCheckedChange={(checked) => onUpdatePreferences({ shareProgress: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="analytics">Analytics</Label>
                      <p className="text-sm text-muted-foreground">Help improve the app with anonymous usage data</p>
                    </div>
                    <Switch
                      id="analytics"
                      checked={user.preferences.analytics}
                      onCheckedChange={(checked) => onUpdatePreferences({ analytics: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
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
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

