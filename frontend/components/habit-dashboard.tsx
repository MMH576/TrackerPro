"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Plus, Star, Trash2, Trophy, CalendarDays, Filter, Grid2X2, List, Search } from "lucide-react"
import { HabitDialog } from "@/components/habit-dialog"
import { HabitCard } from "@/components/habit-card"
import type { Habit } from "@/lib/types"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { useHabits } from "@/hooks/use-habits"
import { useRouter } from "next/navigation"
import { format, addDays, startOfWeek, eachDayOfInterval } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { MainTabs } from "@/components/main-tabs"
import { HabitFilters } from "@/components/habit-filters"
import { ProgressIndicator } from "@/components/progress-indicator"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

interface HabitDashboardProps {
  habits: Habit[]
  activeTab: string
  setActiveTab: (tab: string) => void
  onToggleCompletion: (habitId: string) => void
  onAddHabit: (habit: any) => void
  onDeleteHabit: (habitId: string) => void
  onToggleFavorite: (habitId: string) => void
}

export function HabitDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const { habits, loading, error, toggleCompletion, deleteHabit, toggleFavorite } = useHabits()
  
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date())
  
  // Calculate days for the week view
  const startOfCurrentWeek = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({
    start: startOfCurrentWeek,
    end: addDays(startOfCurrentWeek, 6)
  })
  
  // Filter habits based on search and category
  const filteredHabits = habits.filter(habit => {
    // Search filter
    const matchesSearch = searchQuery === "" || 
      habit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (habit.description && habit.description.toLowerCase().includes(searchQuery.toLowerCase()))
    
    // Log the filtering for debugging
    console.log(`Today View: Filtering habit "${habit.name}", Category: ${habit.category}, Selected filter: ${filterCategory}`)
    
    // Return habits that match both search and category conditions
    return matchesSearch && (
      filterCategory === "all" || 
      (filterCategory === "favorites" && habit.isFavorite) || 
      habit.category === filterCategory
    )
  })
  
  // Get habits that are due today based on their frequency
  const getDueHabitsToday = () => {
    const today = new Date()
    return habits.filter(habit => isHabitDueOnDate(habit, today))
  }
  
  // Calculate completion statistics
  const completedToday = habits.filter(habit => {
    const today = new Date().toISOString().split("T")[0]
    return habit.completedDates.includes(today)
  }).length
  
  const completionRate = habits.length > 0 ? Math.round((completedToday / habits.length) * 100) : 0
  
  // Handle habit completion toggle
  const handleToggleCompletion = (id: string, value?: number) => {
    toggleCompletion(id, value)
    toast({
      title: "Habit updated",
      description: "Your habit has been updated successfully",
      duration: 2000,
    })
  }
  
  // Handle habit deletion
  const handleDeleteHabit = (id: string) => {
    deleteHabit(id)
    toast({
      title: "Habit deleted",
      description: "Your habit has been deleted successfully",
      variant: "destructive",
      duration: 2000,
    })
  }
  
  // Check if a habit is due on a specific date
  const isHabitDueOnDate = (habit: Habit, date: Date) => {
    const dayOfWeek = date.getDay()
    
    // Convert Sunday from 0 to 7 for consistency with our data model
    const adjustedDayOfWeek = dayOfWeek === 0 ? "0" : dayOfWeek.toString()
    
    console.log(`Checking habit "${habit.name}" for date ${date.toDateString()}, day: ${adjustedDayOfWeek}`)
    console.log(`Frequency: ${habit.frequency}, Days: ${habit.days ? JSON.stringify(habit.days) : 'none'}`)
    
    // All daily habits are due every day
    if (habit.frequency === "daily") return true
    
    // Weekday habits are due Monday-Friday
    if (habit.frequency === "weekdays") return dayOfWeek >= 1 && dayOfWeek <= 5
    
    // Weekend habits are due Saturday-Sunday
    if (habit.frequency === "weekends") return dayOfWeek === 0 || dayOfWeek === 6
    
    // Weekly habits are due on specific days
    if (habit.frequency === "weekly" && habit.days && Array.isArray(habit.days)) {
      const isDue = habit.days.includes(adjustedDayOfWeek)
      console.log(`Weekly habit check: ${isDue ? 'Due' : 'Not due'} on day ${adjustedDayOfWeek}`)
      return isDue
    }
    
    return false
  }
  
  // Check if a habit was completed on a specific date
  const wasHabitCompletedOnDate = (habit: Habit, date: Date) => {
    const dateString = date.toISOString().split("T")[0]
    return habit.completedDates.includes(dateString)
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Habit Tracker</h1>
          <p className="text-muted-foreground">Track your daily habits and build consistency</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <ProgressIndicator 
            value={completionRate} 
            label="Today's progress" 
          />
          
          <Button onClick={() => router.push("/dashboard/add-habit")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Habit
          </Button>
        </div>
      </div>
      
      <MainTabs defaultValue="today" className="space-y-4">
        <TabsContent value="today" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-64 flex-shrink-0">
              <div className="space-y-4 sticky top-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search habits..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <HabitFilters 
                  selectedCategory={filterCategory}
                  onCategoryChange={setFilterCategory}
                />
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Stats</CardTitle>
                    <CardDescription>Your current progress</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Complete today:</span>
                      <span className="font-medium">{completedToday}/{habits.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completion rate:</span>
                      <span className="font-medium">{completionRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Habits:</span>
                      <span className="font-medium">{habits.length}</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>View Options</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant={viewMode === "grid" ? "default" : "outline"}
                        size="sm"
                        className="w-full"
                        onClick={() => setViewMode("grid")}
                      >
                        <Grid2X2 className="h-4 w-4 mr-2" />
                        Grid
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "default" : "outline"}
                        size="sm"
                        className="w-full"
                        onClick={() => setViewMode("list")}
                      >
                        <List className="h-4 w-4 mr-2" />
                        List
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="flex-1">
              {filteredHabits.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="rounded-full bg-primary/10 p-3 mb-4">
                    <CalendarDays className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">No habits found</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    {searchQuery 
                      ? `No habits match your search "${searchQuery}". Try a different search term.` 
                      : filterCategory !== "all" 
                        ? `No habits found in the "${filterCategory}" category. Try creating a habit in this category.`
                        : "You haven't created any habits yet. Get started by adding your first habit!"}
                  </p>
                  <Button onClick={() => router.push("/dashboard/add-habit")}>
                    <Plus className="h-4 w-4 mr-2" />
                    {filterCategory !== "all" ? "Add Habit in This Category" : "Add Your First Habit"}
                  </Button>
                </Card>
              ) : (
                viewMode === "grid" ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredHabits.map((habit) => (
                      <HabitCard
                        key={habit.id}
                        habit={habit}
                        onToggleCompletion={handleToggleCompletion}
                        onDelete={handleDeleteHabit}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredHabits.map((habit) => (
                      <Card key={habit.id} className="overflow-hidden">
                        <div className="flex items-center p-4">
                          <div className="flex-1 mr-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">
                                {habit.icon || "✨"}
                              </span>
                              <div>
                                <h3 className="font-medium">{habit.name}</h3>
                                {habit.description && (
                                  <p className="text-sm text-muted-foreground">{habit.description}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {habit.isFavorite && (
                              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                            )}
                            <Badge>{habit.streak} day streak</Badge>
                            <Button
                              variant={wasHabitCompletedOnDate(habit, new Date()) ? "outline" : "default"}
                              size="sm"
                              onClick={() => handleToggleCompletion(habit.id)}
                            >
                              {wasHabitCompletedOnDate(habit, new Date()) ? "Completed" : "Complete"}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="week" className="space-y-4">
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {weekDays.map((day, index) => (
              <Button
                key={index}
                variant={day.toDateString() === selectedDate.toDateString() ? "default" : "outline"}
                className="flex flex-col px-4 py-3 min-w-[85px]"
                onClick={() => setSelectedDate(day)}
              >
                <span className="text-sm font-normal">{format(day, "EEE")}</span>
                <span className="text-xl font-bold">{format(day, "d")}</span>
                <span className="text-xs mt-1 text-muted-foreground">
                  {format(day, "MMM")}
                </span>
              </Button>
            ))}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>
                Habits for {format(selectedDate, "EEEE, MMMM d")}
              </CardTitle>
              <CardDescription>
                {selectedDate.toDateString() === new Date().toDateString() 
                  ? "These are your habits for today"
                  : "View and manage your habits for this day"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-350px)]">
                <div className="space-y-4">
                  {habits
                    .filter(habit => isHabitDueOnDate(habit, selectedDate))
                    .map(habit => (
                      <div key={habit.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xl flex-shrink-0">{habit.icon || "✨"}</span>
                          <div>
                            <h3 className="font-medium">{habit.name}</h3>
                            {habit.description && (
                              <p className="text-sm text-muted-foreground">{habit.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {wasHabitCompletedOnDate(habit, selectedDate) ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Completed
                            </Badge>
                          ) : (
                            selectedDate.toDateString() === new Date().toDateString() && (
                              <Button 
                                size="sm" 
                                onClick={() => handleToggleCompletion(habit.id)}
                              >
                                Complete
                              </Button>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  
                  {habits.filter(habit => isHabitDueOnDate(habit, selectedDate)).length === 0 && (
                    <div className="text-center py-12">
                      <div className="mx-auto rounded-full bg-primary/10 p-3 w-14 h-14 flex items-center justify-center mb-4">
                        <CalendarDays className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No habits scheduled</h3>
                      <p className="text-muted-foreground max-w-md mx-auto mb-6">
                        You don't have any habits scheduled for {format(selectedDate, "EEEE")}.
                        {selectedDate.toDateString() === new Date().toDateString() && 
                          " Why not add a new habit that repeats on this day?"}
                      </p>
                      {selectedDate.toDateString() === new Date().toDateString() && (
                        <Button onClick={() => router.push("/dashboard/add-habit")}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Habit
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </MainTabs>
    </div>
  )
}

