"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Trophy, Heart } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { SocialChallengesView, Friend } from "@/components/social-challenges-view"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SocialPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("friends")
  const [isAddFriendDialogOpen, setIsAddFriendDialogOpen] = useState(false)
  const [friendEmail, setFriendEmail] = useState("")

  // Redirect to dashboard with social tab active
  useEffect(() => {
    router.push("/dashboard?tab=social")
  }, [router])

  // Mock friends data for debugging
  const mockFriends: Friend[] = [
    {
      id: "friend1",
      name: "Jane Smith",
      email: "jane@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "online",
      lastActive: new Date().toISOString()
    },
    {
      id: "friend2",
      name: "John Doe",
      email: "john@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "offline",
      lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]

  // Mock challenges data
  const mockChallenges = [
    {
      id: "challenge1",
      name: "10,000 Steps Challenge",
      description: "Walk 10,000 steps every day for a week",
      type: "steps",
      goal: 10000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdBy: "friend1",
      participants: [
        {
          userId: "friend1",
          progress: 8500,
          joinedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        {
          userId: user?.id || "user1",
          progress: 6000,
          joinedAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
        }
      ]
    }
  ]

  // Show a toast notification for actions
  const showToast = (title: string, description: string) => {
    toast({
      title,
      description,
      duration: 3000,
    })
  }

  // Handle adding a friend
  const handleAddFriend = async () => {
    if (!friendEmail.trim() || !friendEmail.includes('@')) {
      showToast("Invalid email", "Please enter a valid email address")
      return
    }
    
    // In a real app, this would send an API request to add a friend
    showToast("Friend request sent", `A friend request has been sent to ${friendEmail}`)
    setFriendEmail("")
    setIsAddFriendDialogOpen(false)
  }

  // Handle challenge actions with toast notifications
  const handleJoinChallenge = async (id: string) => {
    showToast("Challenge joined!", "You've successfully joined the challenge.")
  }

  const handleLeaveChallenge = async (id: string) => {
    showToast("Challenge left", "You've left the challenge.")
  }

  const handleCreateChallenge = async (
    name: string,
    description: string,
    type: string,
    goal: number,
    startDate: Date,
    endDate: Date
  ) => {
    if (!name || !description || !type || !goal || !startDate || !endDate) {
      showToast("Validation Error", "Please fill all fields to create a challenge")
      return
    }
    
    // In a real app, this would create a challenge in the database
    showToast("Challenge created!", "Your new challenge has been created.")
  }

  const handleUpdateProgress = async (challengeId: string, progress: number) => {
    showToast("Progress updated!", "Your challenge progress has been updated.")
  }

  // Adapt user data for our component
  const adaptedUser = user ? {
    id: user.id,
    name: user.user_metadata?.full_name || user.email,
    email: user.email
  } : { id: "", name: "", email: "" }

  if (authLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <div className="ml-4">Loading user data...</div>
      </div>
    );
  }

  // Temporary loading UI while redirecting
  return (
    <div className="flex justify-center items-center p-12">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      <div className="ml-4">Redirecting to dashboard...</div>
    </div>
  );
}

