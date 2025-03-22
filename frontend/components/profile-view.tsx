"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Award, Calendar, Edit, Mail, MapPin, Trophy, User } from "lucide-react"
import { LineChart } from "@/components/charts/line-chart"
import { HeatmapChart } from "@/components/charts/heatmap-chart"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Habit, UserProfile, Achievement } from "@/lib/types"
import { motion } from "framer-motion"

interface ProfileViewProps {
  user: UserProfile
  habits: Habit[]
  achievements: Achievement[]
  onUpdateProfile: (profile: Partial<UserProfile>) => void
}

export function ProfileView({ user, habits, achievements, onUpdateProfile }: ProfileViewProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [profileData, setProfileData] = useState({
    name: user.name,
    location: user.location,
    email: user.email,
    bio: user.bio || "",
  })

  const handleChange = (field: string, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleUpdateProfile = () => {
    onUpdateProfile(profileData)
    setEditDialogOpen(false)
  }

  // Get overall completion rate
  const getOverallCompletionRate = () => {
    if (habits.length === 0) return 0

    const totalPossibleCompletions = habits.length * 30 // Assuming 30 days
    const totalCompletions = habits.reduce((sum, habit) => sum + habit.completedDates.length, 0)

    return Math.round((totalCompletions / totalPossibleCompletions) * 100)
  }

  // Get longest streak across all habits
  const getLongestStreak = () => {
    if (habits.length === 0) return 0
    return Math.max(...habits.map((habit) => habit.streak))
  }

  // Get habit completion data for recent activity
  const getRecentActivity = () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const todayStr = today.toISOString().split("T")[0]
    const yesterdayStr = yesterday.toISOString().split("T")[0]

    const todayActivities = habits
      .filter((habit) => habit.completedDates.includes(todayStr))
      .map((habit) => ({
        time: "Today",
        action: `Completed ${habit.name}`,
        icon:
          habit.category === "mindfulness"
            ? "🧘"
            : habit.category === "health"
              ? "💪"
              : habit.category === "learning"
                ? "📚"
                : "✅",
      }))

    const yesterdayActivities = habits
      .filter((habit) => habit.completedDates.includes(yesterdayStr))
      .map((habit) => ({
        time: "Yesterday",
        action: `Completed ${habit.name}`,
        icon:
          habit.category === "mindfulness"
            ? "🧘"
            : habit.category === "health"
              ? "💪"
              : habit.category === "learning"
                ? "📚"
                : "✅",
      }))

    return [...todayActivities, ...yesterdayActivities].slice(0, 5) // Get the 5 most recent activities
  }

  // Get top habits by completion rate
  const getTopHabits = () => {
    return [...habits].sort((a, b) => b.progress - a.progress).slice(0, 4)
  }

  // Get habits that need improvement
  const getImprovementHabits = () => {
    return [...habits].sort((a, b) => a.progress - b.progress).slice(0, 4)
  }

  const recentActivity = getRecentActivity()
  const topHabits = getTopHabits()
  const improvementHabits = getImprovementHabits()

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex flex-col items-center md:items-start gap-4">
                <Avatar className="h-24 w-24 border-4 border-background">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="text-center md:text-left">
                  <h2 className="text-2xl font-bold">{user.name}</h2>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{user.location}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground mt-1">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                </div>

                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Edit className="h-4 w-4" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                      <DialogDescription>Update your profile information</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={profileData.name}
                          onChange={(e) => handleChange("name", e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => handleChange("email", e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={profileData.location}
                          onChange={(e) => handleChange("location", e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={profileData.bio}
                          onChange={(e) => handleChange("bio", e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpdateProfile}>Save Changes</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex-1 w-full space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold">{habits.length}</div>
                    <div className="text-sm text-muted-foreground">Total Habits</div>
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold">{getLongestStreak()}</div>
                    <div className="text-sm text-muted-foreground">Day Streak</div>
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold">{getOverallCompletionRate()}%</div>
                    <div className="text-sm text-muted-foreground">Completion</div>
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold">{achievements.filter((a) => a.unlocked).length}</div>
                    <div className="text-sm text-muted-foreground">Achievements</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Trophy className="h-3 w-3" />
                    Streak Master
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Award className="h-3 w-3" />
                    Early Bird
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    90 Days
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <User className="h-3 w-3" />
                    Social Butterfly
                  </Badge>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Current Goals</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <div className="text-sm">Meditation Streak: 30 days</div>
                        <div className="text-sm font-medium">47%</div>
                      </div>
                      <Progress value={47} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <div className="text-sm">Read 12 books this year</div>
                        <div className="text-sm font-medium">75%</div>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList className="flex overflow-x-auto pb-px">
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your habit activity over the past 30 days</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <HeatmapChart height={300} />
              </CardContent>
            </Card>
          </motion.div>

          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Recent Activity</h3>
                  <Card>
                    <CardContent className="p-0">
                      {recentActivity.map((activity, actIndex) => (
                        <div
                          key={actIndex}
                          className={`flex items-start gap-3 p-4 ${
                            actIndex !== recentActivity.length - 1 ? "border-b" : ""
                          }`}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            <span>{activity.icon}</span>
                          </div>
                          <div>
                            <p className="font-medium">{activity.action}</p>
                            <p className="text-sm text-muted-foreground">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="text-4xl mb-4">📅</div>
                <h3 className="text-xl font-medium mb-2">No recent activity</h3>
                <p className="text-muted-foreground mb-6 max-w-md">Complete some habits to see your activity here!</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Habit Completion Over Time</CardTitle>
                <CardDescription>Your progress over the past 6 months</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <LineChart
                  data={Array.from({ length: 30 }, (_, i) => ({
                    name: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    }),
                    value: Math.floor(Math.random() * 40) + 40,
                  }))}
                  height={300}
                />
              </CardContent>
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
                  <CardTitle>Top Habits</CardTitle>
                  <CardDescription>Your most consistent habits</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topHabits.length > 0 ? (
                      topHabits.map((habit, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            <span>
                              {habit.category === "mindfulness"
                                ? "🧘"
                                : habit.category === "health"
                                  ? "💪"
                                  : habit.category === "learning"
                                    ? "📚"
                                    : "✨"}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <p className="font-medium">{habit.name}</p>
                              <p className="text-sm font-medium">{habit.progress}%</p>
                            </div>
                            <Progress value={habit.progress} className="h-2 mt-1" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <p className="text-muted-foreground">No habits to display yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Improvement Areas</CardTitle>
                  <CardDescription>Habits that need more consistency</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {improvementHabits.length > 0 ? (
                      improvementHabits.map((habit, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            <span>
                              {habit.category === "mindfulness"
                                ? "🧘"
                                : habit.category === "health"
                                  ? "💪"
                                  : habit.category === "learning"
                                    ? "📚"
                                    : "✨"}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <p className="font-medium">{habit.name}</p>
                              <p className="text-sm font-medium">{habit.progress}%</p>
                            </div>
                            <Progress value={habit.progress} className="h-2 mt-1" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <p className="text-muted-foreground">No habits to display yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Your Achievements</CardTitle>
                <CardDescription>Badges and milestones you've earned</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {achievements.map((achievement, index) => (
                    <div key={index} className={`rounded-lg border p-4 ${achievement.unlocked ? "" : "opacity-50"}`}>
                      <div className="text-3xl mb-2">{achievement.icon}</div>
                      <h4 className="font-medium">{achievement.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                      <div className="text-xs text-muted-foreground mt-3">
                        {achievement.unlocked ? `Earned on ${achievement.earnedDate}` : "Not yet earned"}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

