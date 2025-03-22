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
}>({
  user: null,
  isLoading: true,
  login: async () => false,
  logout: () => {},
  updateUser: () => {},
  updatePreferences: () => {},
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
          // For demo purposes, auto-login with default user
          setUser(defaultUser)
          localStorage.setItem("habitTrackerUser", JSON.stringify(defaultUser))
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

  return (
    <UserContext.Provider value={{ user, isLoading, login, logout, updateUser, updatePreferences }}>
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

