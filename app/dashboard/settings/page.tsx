"use client"

import { SettingsView } from "@/components/settings-view"
import { useUser } from "@/hooks/use-user"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { user, updatePreferences, updateProfile, updatePassword } = useUser()
  const { toast } = useToast()

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

  const handleUpdatePassword = (passwordData: any) => {
    updatePassword(passwordData)
    toast({
      title: "Password updated",
      description: "Your password has been changed successfully.",
      duration: 3000,
    })
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

