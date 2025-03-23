"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart } from "./line-chart"
import { BarChart } from "./bar-chart"
import { HeatmapChart } from "./heatmap-chart"
import { motion } from "framer-motion"
import type { Habit } from "@/lib/types"

interface OverviewChartsProps {
  habits: Habit[]
  timePeriod?: "7days" | "30days" | "90days" | "year"
}

export function OverviewCharts({ habits, timePeriod = "30days" }: OverviewChartsProps) {
  // Get monthly tracking data
  const monthlyData = useMemo(() => {
    const days = timePeriod === "7days" ? 7 : timePeriod === "30days" ? 30 : timePeriod === "90days" ? 90 : 365
    
    return Array.from({ length: days }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split("T")[0]
      const displayDate = date.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric"
      })
      
      // Count completed habits for this date
      const completedCount = habits.filter(habit => 
        habit.completedDates.includes(dateString)
      ).length
      
      // Calculate percentage
      const percentage = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0
      
      return {
        date: dateString,
        displayDate,
        completed: completedCount,
        total: habits.length,
        percentage
      }
    }).reverse()
  }, [habits, timePeriod])
  
  // Get habit streak data for bar chart
  const streakData = useMemo(() => {
    return habits
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 5)
      .map(habit => ({
        name: habit.name.length > 12 ? habit.name.substring(0, 12) + "..." : habit.name,
        value: habit.streak
      }))
  }, [habits])
  
  // Get overall completion rate
  const completionRate = useMemo(() => {
    if (habits.length === 0) return 0
    
    const selectedData = monthlyData.slice(0, timePeriod === "7days" ? 7 : 30)
    const totalDays = selectedData.length
    
    // Sum all percentages and divide by number of days
    return Math.round(
      selectedData.reduce((sum, day) => sum + day.percentage, 0) / totalDays
    )
  }, [habits, monthlyData, timePeriod])
  
  // Get longest streak
  const longestStreak = useMemo(() => {
    if (habits.length === 0) return 0
    return Math.max(...habits.map(habit => habit.streak))
  }, [habits])
  
  // Get most consistent habit
  const mostConsistentHabit = useMemo(() => {
    if (habits.length === 0) return null
    return [...habits].sort((a, b) => b.progress - a.progress)[0]
  }, [habits])
  
  // Create heatmap data from the most consistent habit
  const heatmapData = useMemo(() => {
    if (!mostConsistentHabit) return undefined
    
    // Convert completed dates to heatmap format
    return mostConsistentHabit.completedDates.map(date => ({
      date,
      value: 4 // Maximum intensity
    }))
  }, [mostConsistentHabit])
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {monthlyData[0]?.percentage > monthlyData[monthlyData.length - 1]?.percentage 
                ? `+${monthlyData[0]?.percentage - monthlyData[monthlyData.length - 1]?.percentage}%` 
                : `${monthlyData[0]?.percentage - monthlyData[monthlyData.length - 1]?.percentage}%`} from last period
            </p>
            <div className="mt-4 h-[120px]">
              <LineChart
                data={monthlyData.map(d => ({
                  name: d.displayDate,
                  value: d.percentage
                }))}
                height={120}
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
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{longestStreak} days</div>
            <p className="text-xs text-muted-foreground">Your longest streak: {longestStreak} days</p>
            <div className="mt-4 h-[120px]">
              <BarChart
                data={streakData}
                height={120}
              />
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
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Most Consistent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {mostConsistentHabit
                ? mostConsistentHabit.name.length > 15
                  ? mostConsistentHabit.name.substring(0, 15) + "..."
                  : mostConsistentHabit.name
                : "No habits yet"}
            </div>
            <p className="text-xs text-muted-foreground">
              {mostConsistentHabit
                ? `${mostConsistentHabit.progress}% completion rate`
                : "Add habits to see stats"}
            </p>
            <div className="mt-4 h-[120px]">
              <HeatmapChart 
                height={120} 
                data={heatmapData}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
} 