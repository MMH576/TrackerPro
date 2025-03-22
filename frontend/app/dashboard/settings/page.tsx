"use client"

import { SettingsView } from "@/components/settings-view"
import { useUser } from "@/hooks/use-user"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useState } from "react"
import { User } from "@/lib/types"

export default function SettingsPage() {
  const { user, updatePreferences, updateProfile, updatePassword } = useUser()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)

  // Ensure we have user data before rendering the settings view
  useEffect(() => {
    if (user) {
      setIsLoading(false)
    }
  }, [user])

  const handleUpdatePreferences = (preferences: any) => {
    updatePreferences(preferences)
    toast({
      title: "Preferences updated",
      description: "Your preferences have been saved.",
      duration: 3000,
    })
  }

  const handleUpdateProfile = (profileData: any) => {
    updateProfile(profileData)
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully.",
      duration: 3000,
    })
  }

  const handleUpdatePassword = (currentPassword: string, newPassword: string) => {
    updatePassword(currentPassword, newPassword)
    toast({
      title: "Password updated",
      description: "Your password has been changed successfully.",
      duration: 3000,
    })
  }

  // Show loading state or render settings when user is available
  if (isLoading || !user) {
    return <div className="flex justify-center items-center min-h-screen">Loading settings...</div>
  }

  return (
    <SettingsView
      user={user}
      onUpdatePreferences={handleUpdatePreferences}
      onUpdateProfile={handleUpdateProfile}
      onUpdatePassword={handleUpdatePassword}
    />
  )
}

