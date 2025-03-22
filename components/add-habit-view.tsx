"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

interface AddHabitViewProps {
  onAddHabit: (habit: any) => void
  onCancel: () => void
}

export function AddHabitView({ onAddHabit, onCancel }: AddHabitViewProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("basic")
  const [habitData, setHabitData] = useState({
    name: "",
    description: "",
    category: "mindfulness",
    type: "yes-no",
    goal: 1,
    frequency: "daily",
    days: ["1", "2", "3", "4", "5"],
    timeOfDay: "morning",
    reminderEnabled: true,
    reminderTime: "08:00",
    missedReminderEnabled: false,
    missedReminderTime: "21:00",
    icon: "🧘",
    color: "blue"
  })
  
  const handleChange = (field: string, value: any) => {
    setHabitData(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  const handleDayToggle = (day: string) => {
    const currentDays = [...habitData.days]
    if (currentDays.includes(day)) {
      handleChange("days", currentDays.filter(d => d !== day))
    } else {
      handleChange("days", [...currentDays, day])
    }
  }
  
  const handleSubmit = () => {
    if (habitData.name.trim()) {
      onAddHabit({
        ...habitData,
        id: `habit-${Date.now()}`,
        streak: 0,
        completedDates: [],
        progress: 0,
        isFavorite: false
      })
    }
  }
  
  const isFormValid = () => {
    return habitData.name.trim() !== ""
  }
  
  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }
  
  const handleNext = () => {
    const tabs = ["basic", "schedule", "reminders", "appearance"]
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1])
    } else {
      handleSubmit()
    }
  }
  
  const handleBack = () => {
    const tabs = ["basic", "schedule", "reminders", "appearance"]
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1])
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Add New Habit</h2>
          <p className="text-muted-foreground">Create a new habit to track</p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="flex overflow-x-auto pb-px">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Habit Details</CardTitle>
                <CardDescription>Basic information about your habit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="habit-name">Habit Name*</Label>
                  <Input 
                    id="habit-name" 
                    placeholder="e.g., Morning Meditation"
                    value={habitData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="habit-description">Description (Optional)</Label>
                  <Textarea 
                    id="habit-description" 
                    placeholder="e.g., 10 minutes of mindfulness meditation each morning"
                    className="min-h-[100px]"
                    value={habitData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="habit-category">Category</Label>
                  <Select 
                    value={habitData.category}
                    onValueChange={(value) => handleChange("category", value)}
                  >
                    <SelectTrigger id="habit-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="health">Health & Fitness</SelectItem>
                      <SelectItem value="learning">Learning</SelectItem>
                      <SelectItem value="productivity">Productivity</SelectItem>
                      <SelectItem value="mindfulness">Mindfulness</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="creativity">Creativity</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label>Habit Type</Label>
                  <RadioGroup 
                    value={habitData.type}
                    onValueChange={(value) => handleChange("type", value)}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="yes-no" id="yes-no" />
                      <Label htmlFor="yes-no" className="flex-1 cursor-pointer">
                        <div className="font-medium">Yes or No</div>
                        <div className="text-sm text-muted-foreground">Simple completion tracking</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="custom" id="custom" />
                      <Label htmlFor="custom" className="flex-1 cursor-pointer">
                        <div className="font-medium">Custom</div>
                        <div className="text-sm text-muted-foreground">Choose specific days</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="counter" id="counter" />
                      <Label htmlFor="counter" className="flex-1 cursor-pointer">
                        <div className="font-medium">Counter</div>
                        <div className="text-sm text-muted-foreground">Track quantity (e.g., glasses of water)</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="timer" id="timer" />
                      <Label htmlFor="timer" className="flex-1 cursor-pointer">
                        <div className="font-medium">Timer</div>
                        <div className="text-sm text-muted-foreground">Track duration (e.g., minutes of reading)</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="habit-goal">Daily Goal</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="habit-goal" 
                      type="number" 
                      value={habitData.goal}
                      onChange={(e) => handleChange("goal", Number.parseInt(e.target.value) || 1)}
                      className="w-24" 
                    />
                    <span className="text-muted-foreground">
                      {habitData.type === "yes-no" 
                        ? "times per day" 
                        : habitData.type === "counter" 
                        ? "units per day" 
                        : "minutes per day"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="schedule" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Schedule
                </CardTitle>
                <CardDescription>When do you want to perform this habit?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Frequency</Label>
                  <RadioGroup 
                    value={habitData.frequency}
                    onValueChange={(value) => handleChange("frequency", value)}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="daily" id="daily" />
                      <Label htmlFor="daily" className="flex-1 cursor-pointer">
                        <div className="font-medium">Daily</div>
                        <div className="text-sm text-muted-foreground">Every day</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="weekly" id="weekly" />
                      <Label htmlFor="weekly" className="flex-1 cursor-pointer">
                        <div className="font-medium">Weekly</div>
                        <div className="text-sm text-muted-foreground">Specific days of the week</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="weekdays" id="weekdays" />
                      <Label htmlFor="weekdays" className="flex-1 cursor-pointer">
                        <div className="font-medium">Weekdays</div>
                        <div className="text-sm text-muted-foreground">Monday to Friday</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="weekends" id="weekends" />
                      <Label htmlFor="weekends" className="flex-1 cursor-pointer">
                        <div className="font-medium">Weekends</div>
                        <div className="text-sm text-muted-foreground">Saturday and Sunday</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                      <RadioGroupItem\

