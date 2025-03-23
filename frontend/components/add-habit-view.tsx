"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  reminderEnabled: z.boolean(),
  reminderTime: z.string().optional(),
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
      reminderEnabled: false,
      reminderTime: "08:00",
      goal: 1,
    },
  })
  
  const habitType = form.watch("type")
  const frequency = form.watch("frequency")
  const reminderEnabled = form.watch("reminderEnabled")
  
  // Keyboard shortcut for form submission
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        form.handleSubmit(onSubmit)();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [form]);
  
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
        reminderEnabled: values.reminderEnabled,
        reminderTime: values.reminderTime,
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
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Add New Habit</h2>
        </div>
      </div>
      
      <Form {...form}>
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 gap-x-6 gap-y-3"
            >
              {/* Left column */}
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Habit Name*</FormLabel>
                      <FormControl>
                        <Input 
                          id="habit-name" 
                          placeholder="e.g., Morning Meditation"
                          className="border-gray-300 focus:border-blue-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Category</FormLabel>
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger id="habit-category" className="border-gray-300 focus:border-blue-500">
                                <SelectValue placeholder="Select" />
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
                      </FormItem>
                    )}
                  />
                  
                  {habitType !== "yes-no" && (
                    <FormField
                      control={form.control}
                      name="goal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium">Daily Goal</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                {...field}
                                className="w-16 border-gray-300 focus:border-blue-500"
                              />
                              <span className="text-xs text-gray-600">
                                {habitType === "counter" ? "times" : "minutes"}
                              </span>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Habit Type</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={cn(
                              "flex-1 text-sm border-gray-300",
                              field.value === "yes-no" 
                                ? "bg-blue-500 text-white hover:bg-blue-600 border-blue-500" 
                                : "bg-white text-gray-700 hover:bg-gray-100"
                            )}
                            onClick={() => field.onChange("yes-no")}
                          >
                            Yes/No
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={cn(
                              "flex-1 text-sm border-gray-300",
                              field.value === "counter" 
                                ? "bg-blue-500 text-white hover:bg-blue-600 border-blue-500" 
                                : "bg-white text-gray-700 hover:bg-gray-100"
                            )}
                            onClick={() => field.onChange("counter")}
                          >
                            Counter
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={cn(
                              "flex-1 text-sm border-gray-300",
                              field.value === "timer" 
                                ? "bg-blue-500 text-white hover:bg-blue-600 border-blue-500" 
                                : "bg-white text-gray-700 hover:bg-gray-100"
                            )}
                            onClick={() => field.onChange("timer")}
                          >
                            Timer
                          </Button>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Right column */}
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Frequency</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={cn(
                              "flex-1 text-sm border-gray-300",
                              field.value === "daily" 
                                ? "bg-blue-500 text-white hover:bg-blue-600 border-blue-500" 
                                : "bg-white text-gray-700 hover:bg-gray-100"
                            )}
                            onClick={() => field.onChange("daily")}
                          >
                            Daily
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={cn(
                              "flex-1 text-sm border-gray-300",
                              field.value === "weekly" 
                                ? "bg-blue-500 text-white hover:bg-blue-600 border-blue-500" 
                                : "bg-white text-gray-700 hover:bg-gray-100"
                            )}
                            onClick={() => field.onChange("weekly")}
                          >
                            Specific days
                          </Button>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {frequency === "weekly" && (
                  <FormField
                    control={form.control}
                    name="frequencyDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Days of the Week</FormLabel>
                        <FormControl>
                          <div className="flex flex-wrap gap-1">
                            {weekdays.map((day) => (
                              <Button
                                key={day.value}
                                type="button"
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "h-8 w-8 p-0 text-xs rounded-md border-gray-300",
                                  field.value.includes(day.value) 
                                    ? "bg-blue-500 text-white border-blue-500 font-medium" 
                                    : "bg-white text-gray-700 hover:bg-gray-100"
                                )}
                                onClick={() => {
                                  const newDays = field.value.includes(day.value)
                                    ? field.value.filter((d) => d !== day.value)
                                    : [...field.value, day.value]
                                  field.onChange(newDays)
                                }}
                              >
                                {day.label.charAt(0)}
                              </Button>
                            ))}
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
                
                <div className="flex items-center gap-3">
                  <FormField
                    control={form.control}
                    name="reminderEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-y-0">
                        <FormLabel className="text-sm mr-2 font-medium">Enable Reminder</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-emerald-600"
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
                        <FormItem className="flex flex-row items-center space-y-0">
                          <FormLabel className="text-sm mr-2 font-medium">At</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                              className="w-28 border-gray-300 focus:border-blue-500"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            </motion.div>
            
            <div className="flex justify-between mt-5 pt-4 border-t border-gray-200">
              <Button 
                variant="outline" 
                onClick={onCancel} 
                size="sm"
                className="text-gray-700 border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </Button>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Ctrl+Enter</span>
                <Button 
                  onClick={form.handleSubmit(onSubmit)} 
                  type="submit" 
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Create Habit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </Form>
    </div>
  )
}

