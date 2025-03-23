"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart } from "@/components/charts/line-chart"
import { BarChart } from "@/components/charts/bar-chart"
import { HeatmapChart } from "@/components/charts/heatmap-chart"
import { OverviewCharts } from "@/components/charts/overview-charts"
import type { Habit } from "@/lib/types"
import { motion } from "framer-motion"

interface ProgressViewProps {
  habits: Habit[]
}

export function ProgressView({ habits }: ProgressViewProps) {
  const [timePeriod, setTimePeriod] = useState("30days")

  // Get last 7 days for weekly chart
  const getLast7Days = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split("T")[0]
    }).reverse()
  }

  // Get last 30 days for monthly chart
  const getLast30Days = () => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split("T")[0]
    }).reverse()
  }

  // Count completed habits per day
  const getCompletionsByDate = (dates: string[]) => {
    return dates.map((date) => {
      const completedCount = habits.filter((habit) => habit.completedDates.includes(date)).length

      return {
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        completed: completedCount,
        total: habits.length,
        percentage: habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0,
      }
    })
  }

  // Get habit completion data for calendar
  const getHabitCompletionDates = () => {
    const allDates = new Set<string>()
    habits.forEach((habit) => {
      habit.completedDates.forEach((date) => {
        allDates.add(date)
      })
    })
    return Array.from(allDates).map((date) => new Date(date))
  }

  // Get completion rate by category
  const getCompletionByCategory = () => {
    const categories = [...new Set(habits.map((habit) => habit.category))]
    return categories.map((category) => {
      const habitsInCategory = habits.filter((habit) => habit.category === category)
      const totalCompletions = habitsInCategory.reduce((sum, habit) => sum + habit.completedDates.length, 0)
      const totalPossible = habitsInCategory.length * 30 // Assuming 30 days

      return {
        category: getCategoryName(category),
        percentage: totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0,
      }
    })
  }

  // Get category display name
  const getCategoryName = (category: string) => {
    switch (category) {
      case "health":
        return "Health & Fitness"
      case "learning":
        return "Learning"
      case "productivity":
        return "Productivity"
      case "mindfulness":
        return "Mindfulness"
      case "finance":
        return "Finance"
      case "creativity":
        return "Creativity"
      case "social":
        return "Social"
      default:
        return "Other"
    }
  }

  const weeklyData = getCompletionsByDate(getLast7Days())
  const monthlyData = getCompletionsByDate(getLast30Days())
  const categoryData = getCompletionByCategory()
  const completedDates = getHabitCompletionDates()

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

  // Get most consistent habit
  const getMostConsistentHabit = () => {
    if (habits.length === 0) return null

    const sortedHabits = [...habits].sort((a, b) => b.progress - a.progress)
    return sortedHabits[0]
  }

  const mostConsistentHabit = getMostConsistentHabit()

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Progress Insights</h2>
          <p className="text-muted-foreground">Track your habit completion over time</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="year">This year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex overflow-x-auto pb-px">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewCharts habits={habits} timePeriod={timePeriod as "7days" | "30days" | "90days" | "year"} />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Monthly Overview</CardTitle>
                <CardDescription>Your habit completion over the past 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <LineChart
                    data={monthlyData.map((d) => ({
                      name: d.date,
                      value: d.percentage,
                    }))}
                    height={250}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Habit Completion Trends</CardTitle>
                <CardDescription>See how your habit completion has changed over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <LineChart
                  data={monthlyData.map((d) => ({
                    name: d.date,
                    value: d.percentage,
                  }))}
                  height={400}
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
                  <CardTitle>Weekly Patterns</CardTitle>
                  <CardDescription>Your most and least productive days</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <BarChart
                    data={[
                      { name: "Mon", value: 75 },
                      { name: "Tue", value: 60 },
                      { name: "Wed", value: 80 },
                      { name: "Thu", value: 65 },
                      { name: "Fri", value: 70 },
                      { name: "Sat", value: 40 },
                      { name: "Sun", value: 50 },
                    ]}
                    height={300}
                  />
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
                  <CardTitle>Time of Day Analysis</CardTitle>
                  <CardDescription>When you're most likely to complete habits</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <BarChart
                    data={[
                      { name: "Morning", value: 85 },
                      { name: "Afternoon", value: 45 },
                      { name: "Evening", value: 65 },
                      { name: "Night", value: 30 },
                    ]}
                    height={300}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Habit Calendar</CardTitle>
                <CardDescription>Days when you completed at least one habit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center p-4">
                  <Calendar mode="multiple" selected={completedDates} className="rounded-md border" />
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
                <CardTitle>Yearly View</CardTitle>
                <CardDescription>Your habit completion throughout the year</CardDescription>
              </CardHeader>
              <CardContent className="h-[200px]">
                <HeatmapChart height={200} />
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Completion by Category</CardTitle>
                <CardDescription>How you're doing across different habit categories</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <BarChart
                  data={categoryData.map((c) => ({
                    name: c.category,
                    value: c.percentage,
                  }))}
                  height={400}
                />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
          >
            {categoryData.slice(0, 4).map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{category.category}</CardTitle>
                      <Badge variant="outline" className="font-normal">
                        {category.percentage}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold mb-2">
                      {habits.filter((h) => getCategoryName(h.category) === category.category).length} habits
                    </div>
                    <div className="h-[100px]">
                      <LineChart
                        data={monthlyData.slice(-10).map((d) => ({
                          name: d.date,
                          value: d.percentage,
                        }))}
                        height={100}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

