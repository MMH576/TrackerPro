"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HabitDashboard } from "@/components/habit-dashboard"
import { ProgressView } from "@/components/progress-view"
import { SocialView } from "@/components/social-view"
import { SettingsView } from "@/components/settings-view"
import { Header } from "@/components/header"
import { useTheme } from "next-themes"
import { useToast } from "@/hooks/use-toast"
import { MobileNav } from "@/components/mobile-nav"
import type { Habit, User, Friend, Challenge } from "@/lib/types"
import { initialHabits, mockFriends, mockChallenges } from "@/lib/mock-data"
import { motion, AnimatePresence } from "framer-motion"

export function DashboardPage() {
  const [habits, setHabits] = useState<Habit[]>(() => {
    // Try to load habits from localStorage
    if (typeof window !== "undefined") {
      const savedHabits = localStorage.getItem("habits")
      return savedHabits ? JSON.parse(savedHabits) : initialHabits
    }
    return initialHabits
  })

  const [activeTab, setActiveTab] = useState("habits")
  const [friends, setFriends] = useState<Friend[]>(mockFriends)
  const [challenges, setChallenges] = useState<Challenge[]>(mockChallenges)
  const [user, setUser] = useState<User>({
    id: "user1",
    name: "Alex Johnson",
    email: "alex@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
    preferences: {
      reminderEnabled: true,
      reminderTime: "20:00",
      calendarSync: false,
      weekStartsOn: 0, // Sunday
      compactView: false,
      animations: true,
      streakAlerts: true,
      achievementAlerts: true,
      friendAlerts: true,
      defaultReminderTime: "08:00",
      defaultCategory: "health",
      publicProfile: true,
      shareProgress: true,
      analytics: true,
    },
  })

  const { theme } = useTheme()
  const { toast } = useToast()

  // Save habits to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("habits", JSON.stringify(habits))
    }
  }, [habits])

  // Update habit completion status
  const toggleHabitCompletion = (habitId: string) => {
    setHabits(
      habits.map((habit) => {
        if (habit.id === habitId) {
          const todayString = getTodayString()
          const wasCompleted = habit.completedDates.includes(todayString)
          const newCompletedDates = wasCompleted
            ? habit.completedDates.filter((date) => date !== todayString)
            : [...habit.completedDates, todayString]

          // Show toast notification
          if (!wasCompleted) {
            toast({
              title: "Habit completed!",
              description: `You've completed "${habit.name}" today.`,
              duration: 3000,
            })
          }

          return {
            ...habit,
            completedDates: newCompletedDates,
          }
        }
        return habit
      }),
    )
  }

  // Add new habit
  const addHabit = (newHabit: Omit<Habit, "id" | "streak" | "completedDates" | "progress" | "isFavorite">) => {
    const habit: Habit = {
      id: `habit-${Date.now()}`,
      streak: 0,
      completedDates: [],
      progress: 0,
      isFavorite: false,
      ...newHabit,
    }
    setHabits([...habits, habit])

    toast({
      title: "Habit created!",
      description: `"${newHabit.name}" has been added to your habits.`,
      duration: 3000,
    })
  }

  // Delete habit
  const deleteHabit = (habitId: string) => {
    const habitToDelete = habits.find((h) => h.id === habitId)
    if (habitToDelete) {
      setHabits(habits.filter((habit) => habit.id !== habitId))

      toast({
        title: "Habit deleted",
        description: `"${habitToDelete.name}" has been removed.`,
        duration: 3000,
      })
    }
  }

  // Toggle favorite status
  const toggleFavorite = (habitId: string) => {
    setHabits(habits.map((habit) => (habit.id === habitId ? { ...habit, isFavorite: !habit.isFavorite } : habit)))
  }

  // Update user preferences
  const updateUserPreferences = (preferences: Partial<User["preferences"]>) => {
    setUser({
      ...user,
      preferences: {
        ...user.preferences,
        ...preferences,
      },
    })

    toast({
      title: "Settings updated",
      description: "Your preferences have been saved.",
      duration: 3000,
    })
  }

  // Update user profile
  const updateUserProfile = (profile: Partial<User>) => {
    setUser({
      ...user,
      ...profile,
    })

    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully.",
      duration: 3000,
    })
  }

  // Join a challenge
  const joinChallenge = (challengeId: string) => {
    // Implementation would connect to backend
    toast({
      title: "Challenge joined!",
      description: "You've successfully joined the challenge.",
      duration: 3000,
    })
  }

  // Leave a challenge
  const leaveChallenge = (challengeId: string) => {
    // Implementation would connect to backend
    setChallenges(challenges.filter((c) => c.id !== challengeId))

    toast({
      title: "Challenge left",
      description: "You've left the challenge.",
      duration: 3000,
    })
  }

  // Create a new challenge
  const createChallenge = (challenge: Omit<Challenge, "id" | "participants" | "startDate" | "endDate">) => {
    const newChallenge: Challenge = {
      id: `challenge-${Date.now()}`,
      participants: [
        { id: "friend-1", progress: Math.floor(Math.random() * 10) },
        { id: "friend-2", progress: Math.floor(Math.random() * 10) },
      ],
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      userProgress: 0,
      totalDays: 30,
      daysLeft: 30,
      ...challenge,
    }

    setChallenges([...challenges, newChallenge])

    toast({
      title: "Challenge created!",
      description: `Your "${challenge.name}" challenge has been created.`,
      duration: 3000,
    })
  }

  // Calculate streaks and progress for all habits
  useEffect(() => {
    const updatedHabits = habits.map((habit) => {
      const { streak, progress } = calculateStreakAndProgress(habit)
      return { ...habit, streak, progress }
    })
    setHabits(updatedHabits)
  }, [habits.map((h) => h.completedDates.join(",")).join("|")])

  // Helper function to get today's date as string
  const getTodayString = () => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  }

  // Calculate streak and progress for a habit
  const calculateStreakAndProgress = (habit: Habit) => {
    // Sort completed dates
    const sortedDates = [...habit.completedDates].sort()

    // Calculate streak
    let streak = 0
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const todayStr = getTodayString()
    const yesterdayStr = yesterday.toISOString().split("T")[0]

    // Check if completed today or yesterday to maintain streak
    const activeToday = habit.completedDates.includes(todayStr)
    const activeYesterday = habit.completedDates.includes(yesterdayStr)

    if (activeToday || activeYesterday) {
      streak = 1
      const checkDate = activeToday ? yesterday : new Date(yesterday)
      checkDate.setDate(checkDate.getDate() - 1)

      while (true) {
        const dateStr = checkDate.toISOString().split("T")[0]
        if (habit.completedDates.includes(dateStr)) {
          streak++
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          break
        }
      }
    }

    // Calculate progress (last 30 days)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split("T")[0]
    })

    const completedInLast30Days = habit.completedDates.filter((date) => last30Days.includes(date)).length

    const progress = Math.round((completedInLast30Days / 30) * 100)

    return { streak, progress }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />

      <main className="container mx-auto p-4 pt-6 pb-20 md:pb-6 max-w-6xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-md mx-auto hidden md:grid">
            <TabsTrigger value="habits">Habits</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="habits" className="space-y-6">
                <HabitDashboard
                  habits={habits}
                  activeTab="all"
                  setActiveTab={() => {}}
                  onToggleCompletion={toggleHabitCompletion}
                  onAddHabit={addHabit}
                  onDeleteHabit={deleteHabit}
                  onToggleFavorite={toggleFavorite}
                />
              </TabsContent>

              <TabsContent value="progress" className="space-y-6">
                <ProgressView habits={habits} />
              </TabsContent>

              <TabsContent value="social" className="space-y-6">
                <SocialView
                  friends={friends}
                  challenges={challenges}
                  onJoinChallenge={joinChallenge}
                  onLeaveChallenge={leaveChallenge}
                  onCreateChallenge={createChallenge}
                />
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <SettingsView
                  user={user}
                  onUpdatePreferences={updateUserPreferences}
                  onUpdateProfile={updateUserProfile}
                  onUpdatePassword={() => {
                    toast({
                      title: "Password updated",
                      description: "Your password has been changed successfully.",
                      duration: 3000,
                    })
                  }}
                />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-10 md:hidden border-t bg-background">
        <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  )
}

