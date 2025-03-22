"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Plus, Star, Trash2, Trophy } from "lucide-react"
import { HabitDialog } from "@/components/habit-dialog"
import type { Habit } from "@/lib/types"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface HabitDashboardProps {
  habits: Habit[]
  activeTab: string
  setActiveTab: (tab: string) => void
  onToggleCompletion: (habitId: string) => void
  onAddHabit: (habit: any) => void
  onDeleteHabit: (habitId: string) => void
  onToggleFavorite: (habitId: string) => void
}

export function HabitDashboard({
  habits,
  activeTab,
  setActiveTab,
  onToggleCompletion,
  onAddHabit,
  onDeleteHabit,
  onToggleFavorite,
}: HabitDashboardProps) {
  const [open, setOpen] = useState(false)
  const [dashboardTab, setDashboardTab] = useState("all")

  const getTodayString = () => {
    return new Date().toISOString().split("T")[0]
  }

  const isCompletedToday = (habit: Habit) => {
    return habit.completedDates.includes(getTodayString())
  }

  const getCompletionRate = () => {
    if (habits.length === 0) return 0
    const completedToday = habits.filter((habit) => isCompletedToday(habit)).length
    return Math.round((completedToday / habits.length) * 100)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "health":
        return "💪"
      case "learning":
        return "📚"
      case "productivity":
        return "⏱️"
      case "mindfulness":
        return "🧘"
      case "finance":
        return "💰"
      case "creativity":
        return "🎨"
      case "social":
        return "👥"
      default:
        return "✨"
    }
  }

  const getFilteredHabits = () => {
    switch (dashboardTab) {
      case "today":
        // Show habits that should be done today based on frequency
        return habits.filter(
          (habit) =>
            habit.frequency === "daily" ||
            (habit.frequency === "weekdays" && [1, 2, 3, 4, 5].includes(new Date().getDay())) ||
            (habit.frequency === "weekends" && [0, 6].includes(new Date().getDay())),
        )
      case "favorites":
        return habits.filter((habit) => habit.isFavorite)
      case "completed":
        return habits.filter((habit) => isCompletedToday(habit))
      case "categories":
        return [] // Categories view doesn't show habit cards
      default:
        return habits
    }
  }

  const getCategories = () => {
    const categories = new Map()

    habits.forEach((habit) => {
      const category = habit.category
      if (!categories.has(category)) {
        categories.set(category, {
          name: getCategoryName(category),
          icon: getCategoryIcon(category),
          count: 1,
        })
      } else {
        const current = categories.get(category)
        categories.set(category, {
          ...current,
          count: current.count + 1,
        })
      }
    })

    return Array.from(categories.entries()).map(([key, value]) => ({
      id: key,
      ...value,
    }))
  }

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

  const handleAddHabit = (habitData: any) => {
    onAddHabit({
      ...habitData,
      isFavorite: false,
    })
    setOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Habits</h2>
          <p className="text-muted-foreground">Track your daily habits and build consistency</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-muted p-3 rounded-lg">
            <div className="text-sm font-medium text-muted-foreground">Today's Progress</div>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{getCompletionRate()}%</div>
              <Progress value={getCompletionRate()} className="w-24 h-2" />
            </div>
          </div>

          <div className="flex gap-2">
            <HabitDialog open={open} onOpenChange={setOpen} onAddHabit={handleAddHabit} />
            <Button className="gap-2" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Habit
            </Button>
            <Link href="/dashboard/add-habit">
              <Button variant="outline">Advanced</Button>
            </Link>
          </div>
        </div>
      </div>

      <Tabs value={dashboardTab} onValueChange={setDashboardTab} className="space-y-4">
        <TabsList className="flex overflow-x-auto pb-px">
          <TabsTrigger value="all">All Habits</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        {dashboardTab !== "categories" ? (
          <TabsContent value={dashboardTab} className="space-y-4">
            {getFilteredHabits().length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-4xl mb-4">✨</div>
                <h3 className="text-xl font-medium mb-2">No habits found</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {dashboardTab === "all"
                    ? "You haven't created any habits yet. Start by adding your first habit!"
                    : dashboardTab === "favorites"
                      ? "You don't have any favorite habits yet. Mark habits as favorites to see them here."
                      : dashboardTab === "completed"
                        ? "You haven't completed any habits today. Keep going!"
                        : "No habits scheduled for today. Enjoy your free time!"}
                </p>
                <Button onClick={() => setOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Habit
                </Button>
              </div>
            ) : (
              <motion.div
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1 }}
              >
                {getFilteredHabits().map((habit, index) => (
                  <motion.div
                    key={habit.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card
                      className={cn(
                        "transition-all hover:shadow-md",
                        isCompletedToday(habit)
                          ? "border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20"
                          : "",
                      )}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span className="text-xl" aria-hidden="true">
                              {getCategoryIcon(habit.category)}
                            </span>
                            <CardTitle className="text-lg">{habit.name}</CardTitle>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-yellow-500"
                              onClick={() => onToggleFavorite(habit.id)}
                            >
                              <Star
                                className={`h-4 w-4 ${habit.isFavorite ? "fill-yellow-500 text-yellow-500" : ""}`}
                              />
                              <span className="sr-only">Favorite</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                              onClick={() => onDeleteHabit(habit.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </div>
                        {habit.description && <CardDescription>{habit.description}</CardDescription>}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 mb-2">
                          <Trophy className="h-4 w-4 text-amber-500" />
                          <div className="text-sm font-medium">
                            {habit.streak > 0 ? `${habit.streak} day streak` : "Start your streak today!"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-sm text-muted-foreground">Monthly progress:</div>
                          <div className="text-sm font-medium">{habit.progress}%</div>
                        </div>
                        <Progress value={habit.progress} className="h-2" />
                      </CardContent>
                      <CardFooter>
                        <Button
                          variant={isCompletedToday(habit) ? "outline" : "default"}
                          className="w-full gap-2"
                          onClick={() => onToggleCompletion(habit.id)}
                        >
                          <CheckCircle2 className={`h-4 w-4 ${isCompletedToday(habit) ? "text-green-500" : ""}`} />
                          {isCompletedToday(habit) ? "Completed Today" : "Mark as Complete"}
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </TabsContent>
        ) : (
          <TabsContent value="categories" className="space-y-4">
            <motion.div
              className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
            >
              {getCategories().map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card
                    className="hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => setDashboardTab("all")}
                  >
                    <CardHeader className="p-4">
                      <div className="flex flex-col items-center text-center">
                        <span className="text-3xl mb-2">{category.icon}</span>
                        <CardTitle className="text-base">{category.name}</CardTitle>
                        <Badge variant="outline" className="mt-2">
                          {category.count} {category.count === 1 ? "habit" : "habits"}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

