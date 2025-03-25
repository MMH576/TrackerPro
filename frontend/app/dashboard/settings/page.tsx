"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeSelector } from "@/components/theme-selector"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { User, Settings, BellRing, Lock, FileCog } from "lucide-react"

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("appearance")
  
  // Mock user preferences - in a real app, these would be fetched from API/database
  const [preferences, setPreferences] = useState({
    theme: "dark",
    weekStartsOn: 0, // Sunday
    reminderEnabled: true,
    reminderTime: "08:00",
    notifyOnAchievements: true,
    notifyOnStreaks: true,
    soundEffects: true,
    compactView: false,
  })

  const handleToggle = (key: string) => (value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
    toast({
      title: "Setting updated",
      description: `${key} has been ${value ? "enabled" : "disabled"}.`,
      duration: 2000,
    })
  }

  const handleSelectChange = (key: string) => (value: string) => {
    setPreferences(prev => ({ ...prev, [key]: key === "weekStartsOn" ? parseInt(value) : value }))
    toast({
      title: "Setting updated",
      description: `${key} has been updated.`,
      duration: 2000,
    })
  }

  const handleInputChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPreferences(prev => ({ ...prev, [key]: e.target.value }))
  }

  const saveReminderTime = () => {
    toast({
      title: "Reminder time updated",
      description: `Reminder time set to ${preferences.reminderTime}.`,
      duration: 2000,
    })
  }

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col space-y-2 mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Customize your experience with Habit Tracker Pro</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <BellRing className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Privacy</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Customize the look and feel of the application</CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeSelector />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Layout & Display</CardTitle>
              <CardDescription>Adjust how content is displayed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compact-view">Compact View</Label>
                  <p className="text-sm text-muted-foreground">Display more content on screen</p>
                </div>
                <Switch
                  id="compact-view"
                  checked={preferences.compactView}
                  onCheckedChange={handleToggle("compactView")}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="week-start">Week Starts On</Label>
                <Select
                  value={preferences.weekStartsOn.toString()}
                  onValueChange={handleSelectChange("weekStartsOn")}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Control when and how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="reminder-enabled">Daily Reminders</Label>
                  <p className="text-sm text-muted-foreground">Get reminded to complete your habits</p>
                </div>
                <Switch
                  id="reminder-enabled"
                  checked={preferences.reminderEnabled}
                  onCheckedChange={handleToggle("reminderEnabled")}
                />
              </div>

              {preferences.reminderEnabled && (
                <div className="grid gap-2 pl-0 ml-0">
                  <Label htmlFor="reminder-time">Reminder Time</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="reminder-time"
                      type="time"
                      value={preferences.reminderTime}
                      onChange={handleInputChange("reminderTime")}
                      className="w-32"
                    />
                    <Button size="sm" onClick={saveReminderTime}>Save</Button>
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="streak-notifications">Streak Notifications</Label>
                  <p className="text-sm text-muted-foreground">Get notified about your streaks</p>
                </div>
                <Switch
                  id="streak-notifications"
                  checked={preferences.notifyOnStreaks}
                  onCheckedChange={handleToggle("notifyOnStreaks")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="achievement-notifications">Achievement Notifications</Label>
                  <p className="text-sm text-muted-foreground">Get notified when you earn achievements</p>
                </div>
                <Switch
                  id="achievement-notifications"
                  checked={preferences.notifyOnAchievements}
                  onCheckedChange={handleToggle("notifyOnAchievements")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sound-effects">Sound Effects</Label>
                  <p className="text-sm text-muted-foreground">Play sounds for notifications and actions</p>
                </div>
                <Switch
                  id="sound-effects"
                  checked={preferences.soundEffects}
                  onCheckedChange={handleToggle("soundEffects")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Update your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input id="display-name" value={user?.user_metadata?.full_name || ""} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user?.email || ""} disabled />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
              </div>

              <div className="grid gap-2 mt-4">
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
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

              <div className="grid gap-2 mt-4">
                <Button>Update Password</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Control your data and privacy preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="analytics">Analytics</Label>
                  <p className="text-sm text-muted-foreground">Allow anonymous usage data collection to improve the app</p>
                </div>
                <Switch id="analytics" defaultChecked />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-md font-medium">Data Export & Deletion</h3>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button variant="outline">Export My Data</Button>
                  <Button variant="destructive">Delete My Account</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

