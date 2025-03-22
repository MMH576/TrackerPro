"use client"

import { ProfileView } from "@/components/profile-view"
import { useUser } from "@/hooks/use-user"
import { useHabits } from "@/hooks/use-habits"
import { useAchievements } from "@/hooks/use-achievements"

export default function ProfilePage() {
  const { user, updateProfile } = useUser()
  const { habits } = useHabits()
  const { achievements } = useAchievements()

  return <ProfileView user={user} habits={habits} achievements={achievements} onUpdateProfile={updateProfile} />
}

