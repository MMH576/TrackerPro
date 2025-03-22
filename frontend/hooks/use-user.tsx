"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"

// Define user type
export interface User {
  id: string
  name: string
  email: string
  avatar: string
  preferences: {
    reminderEnabled: boolean
    reminderTime: string
    calendarSync: boolean
    weekStartsOn: number
    compactView: boolean
    animations: boolean
    streakAlerts: boolean
    achievementAlerts: boolean
    friendAlerts: boolean
    defaultReminderTime: string
    defaultCategory: string
    publicProfile: boolean
    shareProgress: boolean
    analytics: boolean
  }
}

// Default user data
const defaultUser: User = {
  id: "user1",
  name: "Alex Johnson",
  email: "alex@example.com",
  avatar: "/placeholder.svg?height=40&width=40",
  preferences: {
    reminderEnabled: true,
    reminderTime: "20:00",
    calendarSync: false,
    weekStartsOn: 0, // Sunday
    compactView: false,
    animations: true,
    streakAlerts: true,
    achievementAlerts: true,
    friendAlerts: true,
    defaultReminderTime: "09:00",
    defaultCategory: "health",
    publicProfile: false,
    shareProgress: true,
    analytics: true
  },
}

// Create context
const UserContext = createContext<{
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
  updatePreferences: (preferences: Partial<User["preferences"]>) => void
  updateProfile: (profile: Partial<User>) => void
  updatePassword: (currentPassword: string, newPassword: string) => void
}>({
  user: null,
  isLoading: true,
  login: async () => false,
  logout: () => {},
  updateUser: () => {},
  updatePreferences: () => {},
  updateProfile: () => {},
  updatePassword: () => {},
})

// Provider component
export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Simulate loading user data
  useEffect(() => {
    // In a real app, this would be an API call to check authentication
    const checkAuth = async () => {
      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Check if user is logged in (using localStorage in this demo)
        const savedUser = localStorage.getItem("habitTrackerUser")
        if (savedUser) {
          setUser(JSON.parse(savedUser))
        } else {
          // Don't automatically create a default user
          // This ensures authentication is required
          setUser(null)
        }
      } catch (error) {
        console.error("Authentication error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800))

      // In a real app, validate credentials with backend
      // For demo, just check if email contains "@"
      if (email.includes("@")) {
        const loggedInUser = {
          ...defaultUser,
          email,
        }
        setUser(loggedInUser)
        localStorage.setItem("habitTrackerUser", JSON.stringify(loggedInUser))
        return true
      }
      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function
  const logout = () => {
    setUser(null)
    localStorage.removeItem("habitTrackerUser")
  }

  // Update user data
  const updateUser = (userData: Partial<User>) => {
    if (!user) return

    const updatedUser = {
      ...user,
      ...userData,
    }

    setUser(updatedUser)
    localStorage.setItem("habitTrackerUser", JSON.stringify(updatedUser))
  }

  // Update user preferences
  const updatePreferences = (preferences: Partial<User["preferences"]>) => {
    if (!user) return

    const updatedUser = {
      ...user,
      preferences: {
        ...user.preferences,
        ...preferences,
      },
    }

    setUser(updatedUser)
    localStorage.setItem("habitTrackerUser", JSON.stringify(updatedUser))
  }

  // Update user profile
  const updateProfile = (profile: Partial<User>) => {
    if (!user) return
    
    // This is basically the same as updateUser but specifically for profile fields
    const updatedUser = {
      ...user,
      ...profile,
    }
    
    setUser(updatedUser)
    localStorage.setItem("habitTrackerUser", JSON.stringify(updatedUser))
    console.log("Profile updated:", profile)
  }
  
  // Update password
  const updatePassword = (currentPassword: string, newPassword: string) => {
    // In a real app, this would validate the current password and update it in the backend
    // For demo purposes, we'll just log it
    console.log("Password updated from", currentPassword, "to", newPassword)
  }

  return (
    <UserContext.Provider 
      value={{ 
        user, 
        isLoading, 
        login, 
        logout, 
        updateUser, 
        updatePreferences,
        updateProfile,
        updatePassword
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

// Hook to use the user context
export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}

