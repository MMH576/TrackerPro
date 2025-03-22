"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HabitDashboardDesign } from "@/components/habit-dashboard-design"
import { ProgressViewDesign } from "@/components/progress-view-design"
import { SocialViewDesign } from "@/components/social-view-design"
import { SettingsViewDesign } from "@/components/settings-view-design"
import { ProfileViewDesign } from "@/components/profile-view-design"
import { NotificationsViewDesign } from "@/components/notifications-view-design"
import { AddHabitViewDesign } from "@/components/add-habit-view-design"
import { ThemeProvider } from "@/components/theme-provider"
import { HeaderDesign } from "@/components/header-design"
import { Button } from "@/components/ui/button"
import { MobileNavDesign } from "@/components/mobile-nav-design"

export function DashboardDesign() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [showDarkMode, setShowDarkMode] = useState(false)

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className={showDarkMode ? "dark" : ""}>
        <div className="min-h-screen bg-background">
          <HeaderDesign />

          <div className="fixed bottom-0 left-0 right-0 z-10 md:hidden border-t bg-background">
            <MobileNavDesign activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>

          <main className="container mx-auto p-4 pt-6 pb-20 md:pb-6 max-w-6xl">
            <div className="flex justify-end mb-4">
              <Button variant="outline" size="sm" onClick={() => setShowDarkMode(!showDarkMode)} className="text-xs">
                Toggle {showDarkMode ? "Light" : "Dark"} Mode Preview
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid grid-cols-6 w-full max-w-2xl mx-auto hidden md:grid">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="social">Social</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="space-y-6">
                <HabitDashboardDesign />
              </TabsContent>

              <TabsContent value="progress" className="space-y-6">
                <ProgressViewDesign />
              </TabsContent>

              <TabsContent value="social" className="space-y-6">
                <SocialViewDesign />
              </TabsContent>

              <TabsContent value="profile" className="space-y-6">
                <ProfileViewDesign />
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6">
                <NotificationsViewDesign />
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <SettingsViewDesign />
              </TabsContent>

              <TabsContent value="add-habit" className="space-y-6">
                <AddHabitViewDesign />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}

