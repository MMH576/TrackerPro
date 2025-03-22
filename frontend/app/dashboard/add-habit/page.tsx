"use client"

import { useRouter } from "next/navigation"
import { AddHabitView } from "@/components/add-habit-view"
import { useHabits } from "@/hooks/use-habits"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"

export default function AddHabitPage() {
  const router = useRouter()
  const { addHabit, loadHabits, habits } = useHabits()
  const { toast } = useToast()
  const { isDevelopmentMode } = useAuth()

  const handleAddHabit = async (habitData: any) => {
    console.log("Creating habit:", habitData)
    
    try {
      // Add the habit
      const result = await addHabit(habitData)
      console.log("Habit added successfully:", result.data)
      
      // Show success toast
      toast({
        title: "Habit created!",
        description: "Your new habit has been added.",
        duration: 3000,
      })
      
      // Force reload habits to ensure the new habit appears
      console.log("Reloading habits after creating habit")
      await loadHabits()
      
      // Log current habits list from the hook after reloading
      console.log("Current habits after reload:", habits.map(h => h.name))
      
      // Small delay to ensure everything is saved
      console.log("Waiting before redirecting to dashboard...")
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Return to dashboard with a forced refresh by adding a timestamp
      console.log("Redirecting to dashboard with refresh parameter")
      router.push(`/dashboard?refresh=${Date.now()}`)
    } catch (error) {
      console.error("Error adding habit:", error)
      
      toast({
        title: "Failed to create habit",
        description: isDevelopmentMode 
          ? "Error in development mode. Check console for details." 
          : "There was an error creating your habit. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const handleCancel = () => {
    router.push("/dashboard")
  }

  return <AddHabitView onAddHabit={handleAddHabit} onCancel={handleCancel} />
}

