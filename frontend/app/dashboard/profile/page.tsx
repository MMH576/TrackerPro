"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { supabase, updateUserProfile } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

export default function ProfilePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [profile, setProfile] = useState({
    full_name: '',
    avatar_url: ''
  })

  useEffect(() => {
    if (user) {
      // Fetch user profile data
      const fetchProfile = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching profile:', error)
          return
        }

        if (data) {
          setProfile({
            full_name: data.full_name || '',
            avatar_url: data.avatar_url || ''
          })
        }
      }

      fetchProfile()
    }
  }, [user])

  const handleUpdateProfile = async () => {
    if (!user) return

    setIsLoading(true)

    try {
      const { error } = await updateUserProfile(user.id, {
        full_name: profile.full_name,
        avatar_url: profile.avatar_url
      })

      if (error) throw error

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
            <CardDescription>
              Manage your profile information and account settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name} />
                <AvatarFallback className="text-xl">
                  {profile.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-2xl font-semibold">{profile.full_name || 'User'}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  placeholder="Your name" 
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  value={user.email}
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Your email cannot be changed. Contact support if you need to update it.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatar">Avatar URL</Label>
                <Input 
                  id="avatar" 
                  placeholder="https://example.com/avatar.jpg" 
                  value={profile.avatar_url || ''}
                  onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              onClick={handleUpdateProfile}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

