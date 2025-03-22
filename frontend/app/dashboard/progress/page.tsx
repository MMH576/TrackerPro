"use client"

import { ProgressView } from "@/components/progress-view"
import { useHabits } from "@/hooks/use-habits"

export default function ProgressPage() {
  const { habits } = useHabits()

  return <ProgressView habits={habits} />
}

