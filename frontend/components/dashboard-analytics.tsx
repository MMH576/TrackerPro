"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { OverviewCharts } from "@/components/charts/overview-charts"
import { useHabits } from "@/hooks/use-habits"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function DashboardAnalytics() {
  const { habits } = useHabits()
  const [timePeriod, setTimePeriod] = useState<"7days" | "30days" | "90days" | "year">("30days")

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics Overview</h2>
          <p className="text-muted-foreground">Track your progress and stay motivated</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value as any)}>
            <SelectTrigger className="w-[150px]">
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

      <OverviewCharts habits={habits} timePeriod={timePeriod} />
    </div>
  )
} 