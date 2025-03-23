"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HeatmapChart } from "@/components/charts/heatmap-chart"
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
    // Track dates and count of habits completed on each date
    const dateCountMap = new Map<string, number>()
    
    habits.forEach((habit) => {
      habit.completedDates.forEach((date) => {
        // Only include dates from the selected year
        if (new Date(date).getFullYear() === parseInt(yearFilter)) {
          const currentCount = dateCountMap.get(date) || 0
          dateCountMap.set(date, currentCount + 1)
        }
      })
    })
    
    // Convert to format needed for heatmap
    return Array.from(dateCountMap.entries()).map(([date, count]) => ({
      date,
      value: count // Actual count of habits completed on this date
    }))
  }

  const completionData = getHabitCompletionDates()

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
              <div className="h-[280px]">
                <HeatmapChart 
                  height={280} 
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
              <div className="text-center mt-4 text-sm text-muted-foreground">
                Each cell represents a day. Hover over a day to see how many habits you completed.
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </CardContent>
    </Card>
  )
} 