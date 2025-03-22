"use client"

import { useRouter } from "next/navigation"
import { AddHabitView } from "@/components/add-habit-view"
import { useHabits } from "@/hooks/use-habits"
import { useToast } from "@/hooks/use-toast"

export default function AddHabitPage() {
  const router = useRouter()
  const { addHabit } = useHabits()
  const { toast } = useToast()

  const handleAddHabit = (habitData: any) => {
    addHabit(habitData)
    toast({
      title: "Habit created!",
      description: "Your new habit has been added.",
      duration: 3000,
    })
    router.push("/dashboard")
  }

  const handleCancel = () => {
    router.push("/dashboard")
  }

  return <AddHabitView onAddHabit={handleAddHabit} onCancel={handleCancel} />
}

