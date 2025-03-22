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
import { ArrowLeft, Calendar, Check, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from "@/hooks/use-toast"

interface AddHabitViewProps {
  onAddHabit: (habit: any) => void
  onCancel: () => void
}

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(50),
  description: z.string().max(200).optional(),
  category: z.string(),
  type: z.enum(["yes-no", "counter", "timer"]),
  goal: z.coerce.number().min(1),
  frequency: z.string(),
  frequencyDays: z.array(z.string()).min(1, "Select at least one day"),
  timeOfDay: z.string(),
  reminderEnabled: z.boolean(),
  reminderTime: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

const weekdays = [
  { value: "1", label: "Mon" },
  { value: "2", label: "Tue" },
  { value: "3", label: "Wed" },
  { value: "4", label: "Thu" },
  { value: "5", label: "Fri" },
  { value: "6", label: "Sat" },
  { value: "0", label: "Sun" },
];

export function AddHabitView({ onAddHabit, onCancel }: AddHabitViewProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("basic")
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "health",
      type: "yes-no",
      frequency: "daily",
      frequencyDays: ["1", "2", "3", "4", "5", "6", "0"],
      timeOfDay: "morning",
      reminderEnabled: true,
      reminderTime: "08:00",
      goal: 1,
      color: "blue",
      icon: "✨",
    },
  })
  
  const habitType = form.watch("type")
  const frequency = form.watch("frequency")
  const reminderEnabled = form.watch("reminderEnabled")
  
  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }
  
  const handleNext = () => {
    const tabs = ["basic", "schedule", "reminders", "appearance"]
    const currentIndex = tabs.indexOf(activeTab)
    
    if (currentIndex < tabs.length - 1) {
      // Validate current tab fields
      switch (activeTab) {
        case "basic":
          form.trigger(["name", "description", "category", "type", "goal"])
          if (form.formState.errors.name || form.formState.errors.category || form.formState.errors.type || form.formState.errors.goal) {
            return
          }
          break
        case "schedule":
          form.trigger(["frequency", "frequencyDays", "timeOfDay"])
          if (form.formState.errors.frequency || form.formState.errors.frequencyDays || form.formState.errors.timeOfDay) {
            return
          }
          break
        case "reminders":
          form.trigger(["reminderEnabled", "reminderTime"])
          if (reminderEnabled && form.formState.errors.reminderTime) {
            return
          }
          break
      }
      
      setActiveTab(tabs[currentIndex + 1])
    } else {
      form.handleSubmit(onSubmit)()
    }
  }
  
  const handleBack = () => {
    const tabs = ["basic", "schedule", "reminders", "appearance"]
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1])
    }
  }
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      // Development mode fallback for authentication
      const isDevelopment = process.env.NODE_ENV !== 'production'
      
      if (!user && !isDevelopment) {
        toast({
          title: "Authentication error",
          description: "You must be logged in to create habits",
          variant: "destructive",
        })
        return
      }
      
      // Use a mock user ID in development if no user is found
      const userId = user?.id || (isDevelopment ? 'dev-user-123' : null)
      
      if (!userId) {
        toast({
          title: "Authentication error",
          description: "Could not identify user. Please try logging in again.",
          variant: "destructive",
        })
        return
      }
      
      // Format frequency data for Supabase
      const frequencyData = {
        type: values.frequency,
        days: values.frequencyDays.map(Number),
      }
      
      // Create habit in Supabase or mock in development
      let habitData
      
      if (user) {
        // Real API call if user exists
        const { data, error } = await supabase
          .from('habits')
          .insert({
            user_id: userId,
            name: values.name,
            description: values.description || null,
            icon: values.icon || '✨',
            color: values.color || 'blue',
            frequency: frequencyData,
            target_count: values.goal,
            remind_time: values.reminderEnabled ? values.reminderTime : null,
          })
          .select()
        
        if (error) {
          throw error
        }
        
        habitData = data
      } else {
        // Mock data for development when no user
        console.log('Creating habit in development mode with mock user')
        habitData = [{
          id: Math.random().toString(36).substring(2, 9),
          user_id: userId,
          name: values.name,
          description: values.description || null,
          icon: values.icon || '✨',
          color: values.color || 'blue',
        }]
      }
      
      // Call onAddHabit with the returned data
      const newHabit = {
        id: habitData[0]?.id || Math.random().toString(36).substring(2, 9),
        name: values.name,
        description: values.description,
        category: values.category,
        type: values.type,
        goal: values.goal,
        frequency: values.frequency,
        days: values.frequencyDays,
        timeOfDay: values.timeOfDay,
        reminderEnabled: values.reminderEnabled,
        reminderTime: values.reminderTime,
        icon: values.icon,
        color: values.color,
        streak: 0,
        completedDates: [],
        progress: 0,
        isFavorite: false
      }
      
      onAddHabit(newHabit)
      
      toast({
        title: "Habit created!",
        description: "Your new habit has been added successfully",
      })
    } catch (error) {
      console.error('Error creating habit:', error)
      toast({
        title: "Failed to create habit",
        description: "There was an error creating your habit. Please try again.",
        variant: "destructive",
      })
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
        
        <Form {...form}>
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
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Habit Name*</FormLabel>
                        <FormControl>
                          <Input 
                            id="habit-name" 
                            placeholder="e.g., Morning Meditation"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Enter a clear and specific name for your habit.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            id="habit-description" 
                            placeholder="e.g., 10 minutes of mindfulness meditation each morning"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Add details about how to complete this habit.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <FormControl>
                            <Select 
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger id="habit-category">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="health">Health</SelectItem>
                                <SelectItem value="mindfulness">Mindfulness</SelectItem>
                                <SelectItem value="productivity">Productivity</SelectItem>
                                <SelectItem value="learning">Learning</SelectItem>
                                <SelectItem value="finance">Finance</SelectItem>
                                <SelectItem value="creativity">Creativity</SelectItem>
                                <SelectItem value="social">Social</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription>Group similar habits together.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Habit Type</FormLabel>
                          <FormControl>
                            <RadioGroup 
                              onValueChange={field.onChange} 
                              value={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="yes-no" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Yes/No
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="counter" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Counter
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="timer" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Timer
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormDescription>
                            {habitType === "yes-no" && "Simple completion tracking (did you do it or not)"}
                            {habitType === "counter" && "Track a specific quantity (e.g., glasses of water)"}
                            {habitType === "timer" && "Track duration (e.g., minutes of meditation)"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {habitType !== "yes-no" && (
                    <FormField
                      control={form.control}
                      name="goal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daily Goal</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <Input 
                                type="number" 
                                min={1}
                                {...field}
                                className="w-20"
                              />
                              <span className="text-sm text-muted-foreground">
                                {habitType === "counter" ? "units" : "minutes"}
                              </span>
                            </div>
                          </FormControl>
                          <FormDescription>
                            {habitType === "counter" 
                              ? "How many units do you want to track daily?" 
                              : "How many minutes do you want to track daily?"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
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
                  <CardTitle>Schedule</CardTitle>
                  <CardDescription>When do you want to perform this habit?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Frequency</FormLabel>
                        <FormControl>
                          <RadioGroup 
                            onValueChange={field.onChange} 
                            value={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="daily" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Daily
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="weekly" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Specific days of the week
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {frequency === "weekly" && (
                    <FormField
                      control={form.control}
                      name="frequencyDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Days of the Week</FormLabel>
                          <FormControl>
                            <div className="flex flex-wrap gap-2">
                              {weekdays.map((day) => (
                                <Button
                                  key={day.value}
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className={cn(
                                    "h-9 w-9 p-0",
                                    field.value.includes(day.value) && "bg-primary text-primary-foreground"
                                  )}
                                  onClick={() => {
                                    const newDays = field.value.includes(day.value)
                                      ? field.value.filter((d) => d !== day.value)
                                      : [...field.value, day.value]
                                    field.onChange(newDays)
                                  }}
                                >
                                  {day.label}
                                </Button>
                              ))}
                            </div>
                          </FormControl>
                          <FormDescription>Select the days you want to perform this habit.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="timeOfDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time of Day</FormLabel>
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select time of day" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="morning">Morning</SelectItem>
                              <SelectItem value="afternoon">Afternoon</SelectItem>
                              <SelectItem value="evening">Evening</SelectItem>
                              <SelectItem value="anytime">Anytime</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>When do you prefer to do this habit?</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
          
          <TabsContent value="reminders" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Reminders</CardTitle>
                  <CardDescription>Set up notifications to help you stay on track</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="reminderEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Reminders</FormLabel>
                          <FormDescription>
                            Receive notifications to complete your habit
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {reminderEnabled && (
                    <FormField
                      control={form.control}
                      name="reminderTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reminder Time</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            When would you like to be reminded?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
          
          <TabsContent value="appearance" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize how your habit looks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <FormControl>
                          <div className="flex flex-wrap gap-2">
                            {["blue", "green", "red", "purple", "orange", "pink", "slate"].map((color) => (
                              <Button
                                key={color}
                                type="button"
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "h-10 w-10 rounded-full p-0",
                                  `bg-${color}-500 hover:bg-${color}-600`,
                                  field.value === color && "ring-2 ring-offset-2"
                                )}
                                style={{ 
                                  backgroundColor: `var(--${color}-500, ${color})`,
                                  border: field.value === color ? '2px solid var(--ring, black)' : 'none' 
                                }}
                                onClick={() => field.onChange(color)}
                              >
                                {field.value === color && <Check className="h-4 w-4 text-white" />}
                              </Button>
                            ))}
                          </div>
                        </FormControl>
                        <FormDescription>Choose a color for your habit</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon</FormLabel>
                        <FormControl>
                          <div className="flex flex-wrap gap-2">
                            {["✨", "💪", "📚", "⏱️", "🧘", "💰", "🎨", "👥", "🏆", "🍎", "🌱", "🏃"].map((icon) => (
                              <Button
                                key={icon}
                                type="button"
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "h-10 w-10 p-0 text-lg",
                                  field.value === icon && "bg-primary text-primary-foreground"
                                )}
                                onClick={() => field.onChange(icon)}
                              >
                                {icon}
                              </Button>
                            ))}
                          </div>
                        </FormControl>
                        <FormDescription>Choose an icon for your habit</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Form>
      </Tabs>
      
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={activeTab === "basic" ? onCancel : handleBack}
        >
          {activeTab === "basic" ? "Cancel" : "Back"}
        </Button>
        
        {activeTab === "appearance" ? (
          <Button onClick={form.handleSubmit(onSubmit)} type="submit">
            Create Habit
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Next
            <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
          </Button>
        )}
      </div>
    </div>
  )
}

