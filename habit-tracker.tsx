"use client"

import { useState } from "react"
import { Calendar, CheckCircle2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

export default function HabitTracker() {
  const [habits, setHabits] = useState([
    { id: 1, name: "Morning Meditation", streak: 5, completed: true, progress: 71 },
    { id: 2, name: "Read 30 minutes", streak: 12, completed: true, progress: 86 },
    { id: 3, name: "Drink 8 glasses of water", streak: 3, completed: false, progress: 43 },
    { id: 4, name: "Exercise", streak: 7, completed: false, progress: 50 },
  ])
  const [newHabit, setNewHabit] = useState("")
  const [open, setOpen] = useState(false)

  const addHabit = () => {
    if (newHabit.trim()) {
      setHabits([
        ...habits,
        {
          id: habits.length + 1,
          name: newHabit,
          streak: 0,
          completed: false,
          progress: 0,
        },
      ])
      setNewHabit("")
      setOpen(false)
    }
  }

  const toggleComplete = (id: number) => {
    setHabits(habits.map((habit) => (habit.id === id ? { ...habit, completed: !habit.completed } : habit)))
  }

  const deleteHabit = (id: number) => {
    setHabits(habits.filter((habit) => habit.id !== id))
  }

  const completedCount = habits.filter((habit) => habit.completed).length
  const completionRate = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Habit Tracker</h1>
          <p className="text-muted-foreground mt-1">Track your daily habits and build consistency</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-muted p-3 rounded-lg">
            <div className="text-sm font-medium text-muted-foreground">Today's Progress</div>
            <div className="text-2xl font-bold">{completionRate}%</div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Habit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Habit</DialogTitle>
                <DialogDescription>Create a new habit to track daily.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="habit-name">Habit Name</Label>
                  <Input
                    id="habit-name"
                    placeholder="e.g., Morning Meditation"
                    value={newHabit}
                    onChange={(e) => setNewHabit(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addHabit}>Add Habit</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="today" className="mb-8">
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="all">All Habits</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>
        <TabsContent value="today" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {habits.map((habit) => (
              <Card key={habit.id} className={habit.completed ? "border-green-200 bg-green-50" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{habit.name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => deleteHabit(habit.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                  <CardDescription>Current streak: {habit.streak} days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-sm text-muted-foreground">Monthly progress:</div>
                    <div className="text-sm font-medium">{habit.progress}%</div>
                  </div>
                  <Progress value={habit.progress} className="h-2" />
                </CardContent>
                <CardFooter>
                  <Button
                    variant={habit.completed ? "outline" : "default"}
                    className="w-full gap-2"
                    onClick={() => toggleComplete(habit.id)}
                  >
                    <CheckCircle2 className={`h-4 w-4 ${habit.completed ? "text-green-500" : ""}`} />
                    {habit.completed ? "Completed" : "Mark as Complete"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="all" className="mt-4">
          <div className="grid gap-4">
            {habits.map((habit) => (
              <div key={habit.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{habit.name}</div>
                  <div className="text-sm text-muted-foreground">Streak: {habit.streak} days</div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${habit.completed ? "text-green-500" : ""}`}
                  onClick={() => toggleComplete(habit.id)}
                >
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="sr-only">Toggle complete</span>
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="stats" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Monthly Overview
              </CardTitle>
              <CardDescription>Your habit completion statistics for this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <div className="text-sm font-medium">Overall Completion Rate</div>
                    <div className="text-sm font-medium">{completionRate}%</div>
                  </div>
                  <Progress value={completionRate} className="h-2" />
                </div>
                {habits.map((habit) => (
                  <div key={habit.id}>
                    <div className="flex justify-between mb-1">
                      <div className="text-sm font-medium">{habit.name}</div>
                      <div className="text-sm font-medium">{habit.progress}%</div>
                    </div>
                    <Progress value={habit.progress} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

