"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Award, Medal, Trophy, Users, UserPlus, Clock, Calendar, Heart } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Friend, Challenge } from "@/lib/types"
import { motion } from "framer-motion"

interface SocialViewProps {
  friends: Friend[]
  challenges: Challenge[]
  onJoinChallenge: (challengeId: string) => void
  onLeaveChallenge: (challengeId: string) => void
  onCreateChallenge: (challenge: any) => void
}

export function SocialView({
  friends,
  challenges,
  onJoinChallenge,
  onLeaveChallenge,
  onCreateChallenge,
}: SocialViewProps) {
  const [activeTab, setActiveTab] = useState("leaderboard")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newChallenge, setNewChallenge] = useState({
    name: "",
    description: "",
    duration: "30",
    type: "habit",
    habitId: "",
  })
  const [socialTab, setSocialTab] = useState("friends")

  const handleCreateChallenge = () => {
    if (newChallenge.name.trim()) {
      onCreateChallenge({
        ...newChallenge,
        id: `challenge-${Date.now()}`,
        participants: [{ id: "user", progress: 0 }],
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + Number.parseInt(newChallenge.duration) * 24 * 60 * 60 * 1000).toISOString(),
      })

      // Reset form
      setNewChallenge({
        name: "",
        description: "",
        duration: "30",
        type: "habit",
        habitId: "",
      })

      setCreateDialogOpen(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setNewChallenge((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Social</h2>
          <p className="text-muted-foreground">Connect with friends and join challenges</p>
        </div>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Friend
        </Button>
      </div>

      <Tabs value={socialTab} onValueChange={setSocialTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-4">
          {friends.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Friends Yet</CardTitle>
                <CardDescription>
                  Add friends to share your habit journey and motivate each other.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add Friend
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {friends.map((friend) => (
                <Card key={friend.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={friend.avatar} alt={friend.name} />
                          <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{friend.name}</CardTitle>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Badge variant="outline" className="mr-2">
                              <div className={`mr-1 h-2 w-2 rounded-full ${friend.status === 'online' ? 'bg-green-500' : 'bg-gray-300'}`} />
                              {friend.status === 'online' ? 'Online' : 'Offline'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Trophy className="h-4 w-4 text-amber-500" />
                          <span>Current Streak</span>
                        </div>
                        <span className="font-medium">{friend.streak || 0} days</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4 text-red-500" />
                          <span>Weekly Score</span>
                        </div>
                        <span className="font-medium">{friend.weeklyScore || 0} pts</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">View Profile</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          {challenges.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Challenges Yet</CardTitle>
                <CardDescription>
                  Join or create challenges to compete with friends and stay motivated.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button>Create Challenge</Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {challenges.map((challenge) => (
                <Card key={challenge.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{challenge.name}</CardTitle>
                        <CardDescription>{challenge.description}</CardDescription>
                      </div>
                      <Badge variant={challenge.isJoined ? "default" : "outline"}>
                        {challenge.isJoined ? "Joined" : "Not Joined"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{challenge.participants.length} participants</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{challenge.daysLeft} days left</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{challenge.type}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Your progress</span>
                        <span className="font-medium">{challenge.userProgress}%</span>
                      </div>
                      <Progress value={challenge.userProgress} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Leaderboard</p>
                      <div className="space-y-2">
                        {challenge.participants
                          .sort((a, b) => b.progress - a.progress)
                          .slice(0, 3)
                          .map((participant, index) => (
                            <div key={participant.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                  {index + 1}
                                </div>
                                <span>{participant.name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-medium">{participant.progress}%</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    {challenge.isJoined ? (
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => onLeaveChallenge(challenge.id)}
                      >
                        Leave Challenge
                      </Button>
                    ) : (
                      <Button 
                        className="w-full" 
                        onClick={() => onJoinChallenge(challenge.id)}
                      >
                        Join Challenge
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Feed</CardTitle>
              <CardDescription>See what your friends have been up to</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-6">
                Activity feed is coming soon. Check back later!
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

