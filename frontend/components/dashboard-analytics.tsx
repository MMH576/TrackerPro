"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HeatmapChart } from "@/components/charts/heatmap-chart"
import { BarChart } from "@/components/charts/bar-chart"
import type { Habit } from "@/lib/types"
import { motion } from "framer-motion"

interface DashboardAnalyticsProps {
  habits: Habit[]
}

export function DashboardAnalytics({ habits }: DashboardAnalyticsProps) {
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString())
  const [timePeriod, setTimePeriod] = useState("30days")
  
  // Detect available years in the data
  const years = Array.from(
    new Set(
      habits
        .flatMap(habit => habit.completedDates)
        .map(date => new Date(date).getFullYear())
        .filter(year => !isNaN(year))
    )
  ).sort((a, b) => b - a) // Sort descending

  // If no years found in data, use current year
  const availableYears = years.length > 0 
    ? years 
    : [new Date().getFullYear()]
  
  // Get all completed dates for heatmap
  const getHabitCompletionDates = () => {
    const allDates = new Set<string>()
    habits.forEach((habit) => {
      habit.completedDates.forEach((date) => {
        // Only include dates from the selected year
        if (new Date(date).getFullYear() === parseInt(yearFilter)) {
          allDates.add(date)
        }
      })
    })
    
    // Convert to format needed for heatmap
    return Array.from(allDates).map(date => ({
      date,
      value: 4 // Maximum intensity for completed dates
    }))
  }

  // Get streak information
  const getStreakData = () => {
    if (habits.length === 0) return { current: 0, longest: 0, topHabits: [] }
    
    const longestStreak = Math.max(...habits.map((habit) => habit.streak))
    const currentStreak = habits.reduce((sum, habit) => sum + (habit.streak > 0 ? 1 : 0), 0)
    
    // Get top habits by streak
    const topHabits = [...habits]
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 5)
      .map(habit => ({
        name: habit.name.length > 15 ? habit.name.substring(0, 15) + "..." : habit.name,
        value: habit.streak
      }))
    
    return { current: currentStreak, longest: longestStreak, topHabits }
  }

  // Get category data for bar chart
  const getCategoryData = () => {
    const categories = new Map<string, { count: number, completed: number, total: number }>()
    
    // Get period days count
    const periodDays = timePeriod === "7days" ? 7 : 
                       timePeriod === "30days" ? 30 : 
                       timePeriod === "90days" ? 90 : 365
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - periodDays)
    
    habits.forEach(habit => {
      const categoryName = getCategoryName(habit.category)
      const entry = categories.get(categoryName) || { count: 0, completed: 0, total: 0 }
      
      // Filter completed dates by selected time period and year
      const completedInPeriod = habit.completedDates.filter(
        date => {
          const completionDate = new Date(date)
          return completionDate >= startDate && 
                 completionDate <= endDate && 
                 completionDate.getFullYear() === parseInt(yearFilter)
        }
      ).length
      
      categories.set(categoryName, {
        count: entry.count + 1,
        completed: entry.completed + completedInPeriod,
        total: entry.total + periodDays // Max possible completions in period
      })
    })
    
    return Array.from(categories.entries())
      .map(([category, data]) => ({
        name: category,
        value: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
        count: data.count
      }))
      .sort((a, b) => b.value - a.value)
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
  
  // Format streak text with proper grammar
  const formatStreakText = (count: number) => {
    return count === 1 ? `${count} day` : `${count} days`
  }
  
  const completionData = getHabitCompletionDates()
  const categoryData = getCategoryData()
  const streakData = getStreakData()

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Analytics Overview</CardTitle>
          <CardDescription>Track your progress and stay motivated</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="year">This year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Yearly Activity View - GitHub Style */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden border-muted/60">
            <CardHeader className="pb-2 bg-card/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M8 12H12V8H8V12Z" fill="currentColor" />
                  <path d="M16 12H12V16H16V12Z" fill="currentColor" />
                </svg>
                Yearly Activity
              </CardTitle>
              <CardDescription>Your habit completion throughout {yearFilter}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[180px]">
                <HeatmapChart 
                  height={180} 
                  data={completionData}
                  showMonthLabels={true}
                  year={parseInt(yearFilter)}
                />
              </div>
              <div className="flex justify-between items-center mt-4 pt-3 text-xs text-muted-foreground border-t">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-800"></div>
                  <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900"></div>
                  <div className="w-3 h-3 rounded-sm bg-emerald-300 dark:bg-emerald-700"></div>
                  <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-600"></div>
                  <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
                </div>
                <span>More</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <div className="grid gap-4 md:grid-cols-2">
          {/* Streaks */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Streaks</CardTitle>
                <CardDescription>Current and longest habit streaks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <div className="text-sm text-muted-foreground">Current</div>
                    <div className="text-3xl font-bold">{streakData.current}</div>
                    <div className="text-xs text-muted-foreground">active habits</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Longest</div>
                    <div className="text-3xl font-bold">{formatStreakText(streakData.longest)}</div>
                    <div className="text-xs text-muted-foreground">consecutive</div>
                  </div>
                </div>
                
                <div className="h-[150px]">
                  <BarChart
                    data={streakData.topHabits}
                    height={150}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Categories */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Categories</CardTitle>
                <CardDescription>Completion rate by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[230px]">
                  <BarChart
                    data={categoryData}
                    height={230}
                    showValues={true}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  )
} 