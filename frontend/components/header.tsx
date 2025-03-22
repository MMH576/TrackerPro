"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, LogOut, Settings, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { useState } from "react"

export function Header() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await signOut()
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      })
    } catch (error) {
      console.error("Error logging out:", error)
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationClick = () => {
    router.push("/dashboard/notifications")
  }

  // If no user, render a minimal header
  if (!user) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center max-w-6xl">
          <div className="mr-4 flex">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-primary h-8 w-8 rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground text-lg font-bold">H</span>
              </div>
              <span className="font-bold hidden sm:inline-block">HabitHero</span>
            </Link>
          </div>
        </div>
      </header>
    )
  }

  const userInitial = user.user_metadata?.full_name?.charAt(0) || 
                     user.email?.charAt(0) || 'U'
  
  const userName = user.user_metadata?.full_name || 'User'
  const userEmail = user.email || ''
  const userAvatar = user.user_metadata?.avatar_url || ''

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center max-w-6xl">
        <div className="mr-4 flex">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="bg-primary h-8 w-8 rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground text-lg font-bold">H</span>
            </div>
            <span className="font-bold hidden sm:inline-block">HabitHero</span>
          </Link>
        </div>
        <div className="flex-1"></div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative" onClick={handleNotificationClick}>
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userAvatar} alt={userName} />
                  <AvatarFallback>{userInitial}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={isLoading} onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{isLoading ? "Logging out..." : "Log out"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

