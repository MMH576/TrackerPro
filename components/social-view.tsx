"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Award, Medal, Trophy, Users } from "lucide-react"
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
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Social Challenges</h2>
        <p className="text-muted-foreground">Compete with friends and stay motivated</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex overflow-x-auto pb-px">
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Weekly Leaderboard
                </CardTitle>
                <CardDescription>See how you rank against your friends this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
                      <Trophy className="h-5 w-5 text-amber-500" />
                    </div>
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium leading-none">You</p>
                        <p className="text-sm font-medium">88 pts</p>
                      </div>
                      <Progress value={88} max={100} className="h-2 mt-2" />
                    </div>
                  </div>

                  {friends
                    .sort((a, b) => b.weeklyScore - a.weeklyScore)
                    .map((friend, index) => (
                      <div key={friend.id} className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          {index === 0 ? (
                            <Medal className="h-5 w-5 text-amber-500" />
                          ) : index === 1 ? (
                            <Medal className="h-5 w-5 text-slate-400" />
                          ) : index === 2 ? (
                            <Medal className="h-5 w-5 text-amber-700" />
                          ) : (
                            <span className="text-sm font-bold">{index + 2}</span>
                          )}
                        </div>
                        <Avatar className="h-10 w-10 border">
                          <AvatarImage src={friend.avatar} alt={friend.name} />
                          <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <p className="text-sm font-medium leading-none">{friend.name}</p>
                            <p className="text-sm font-medium">{friend.weeklyScore} pts</p>
                          </div>
                          <Progress value={friend.weeklyScore} max={100} className="h-2 mt-2" />
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  View Full Leaderboard
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Active Challenges</h3>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>Create Challenge</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Challenge</DialogTitle>
                  <DialogDescription>Invite friends to compete in a habit challenge</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="challenge-name">Challenge Name</Label>
                    <Input
                      id="challenge-name"
                      placeholder="e.g., 30-Day Meditation Challenge"
                      value={newChallenge.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="challenge-description">Description</Label>
                    <Textarea
                      id="challenge-description"
                      placeholder="Describe the challenge rules and goals"
                      value={newChallenge.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="challenge-duration">Duration (Days)</Label>
                      <Select value={newChallenge.duration} onValueChange={(value) => handleChange("duration", value)}>
                        <SelectTrigger id="challenge-duration">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="14">14 days</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="60">60 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="challenge-type">Challenge Type</Label>
                      <Select value={newChallenge.type} onValueChange={(value) => handleChange("type", value)}>
                        <SelectTrigger id="challenge-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="habit">Habit Completion</SelectItem>
                          <SelectItem value="streak">Longest Streak</SelectItem>
                          <SelectItem value="count">Highest Count</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateChallenge}>Create Challenge</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <motion.div
            className="grid gap-4 md:grid-cols-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
          >
            {challenges.length === 0 ? (
              <div className="md:col-span-2 flex flex-col items-center justify-center py-12 text-center">
                <div className="text-4xl mb-4">🏆</div>
                <h3 className="text-xl font-medium mb-2">No active challenges</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  You don't have any active challenges. Create a challenge to compete with friends!
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>Create Your First Challenge</Button>
              </div>
            ) : (
              challenges.map((challenge, index) => (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>{challenge.name}</CardTitle>
                        <Badge
                          className={
                            challenge.type === "habit"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900"
                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900"
                          }
                        >
                          {challenge.daysLeft} days left
                        </Badge>
                      </div>
                      <CardDescription>{challenge.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                            <AvatarFallback>U</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <p className="text-sm font-medium">You</p>
                              <p className="text-sm">
                                {challenge.userProgress}/{challenge.totalDays} days
                              </p>
                            </div>
                            <Progress
                              value={(challenge.userProgress / challenge.totalDays) * 100}
                              className="h-2 mt-1"
                            />
                          </div>
                        </div>
                        {challenge.participants.map((participant, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={
                                  friends.find((f) => f.id === participant.id)?.avatar ||
                                  "/placeholder.svg?height=32&width=32"
                                }
                                alt={friends.find((f) => f.id === participant.id)?.name || "Participant"}
                              />
                              <AvatarFallback>
                                {(friends.find((f) => f.id === participant.id)?.name || "P").charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <p className="text-sm font-medium">
                                  {friends.find((f) => f.id === participant.id)?.name || "Participant"}
                                </p>
                                <p className="text-sm">
                                  {participant.progress}/{challenge.totalDays} days
                                </p>
                              </div>
                              <Progress
                                value={(participant.progress / challenge.totalDays) * 100}
                                className="h-2 mt-1"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline">View Details</Button>
                      <Button
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={() => onLeaveChallenge(challenge.id)}
                      >
                        Leave Challenge
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Challenge Ideas</CardTitle>
                <CardDescription>Popular challenges to try with friends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { name: "30-Day Fitness", description: "Exercise daily for a month" },
                    { name: "Water Drinking", description: "Drink 8 glasses daily" },
                    { name: "Early Bird", description: "Wake up before 6am" },
                    { name: "Digital Detox", description: "Reduce screen time" },
                    { name: "Gratitude Journal", description: "Write daily gratitudes" },
                    { name: "Learn a Skill", description: "Practice 20 min daily" },
                  ].map((challenge, index) => (
                    <div
                      key={index}
                      className="rounded-lg border p-3 hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => {
                        setNewChallenge({
                          ...newChallenge,
                          name: challenge.name,
                          description: challenge.description,
                        })
                        setCreateDialogOpen(true)
                      }}
                    >
                      <h4 className="font-medium">{challenge.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{challenge.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="friends" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Friends
                </CardTitle>
                <CardDescription>Connect with friends to compete and stay motivated</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {friends.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="text-4xl mb-4">👥</div>
                      <h3 className="text-xl font-medium mb-2">No friends yet</h3>
                      <p className="text-muted-foreground mb-6 max-w-md">
                        Add friends to compete in challenges and stay motivated together!
                      </p>
                    </div>
                  ) : (
                    friends.map((friend) => (
                      <div key={friend.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={friend.avatar} alt={friend.name} />
                            <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{friend.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {friend.activeStreak > 0 ? `${friend.activeStreak} day streak` : "No active streak"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {friend.activeStreak >= 7 && (
                            <Award className="h-5 w-5 text-amber-500" title="7+ day streak" />
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setNewChallenge({
                                ...newChallenge,
                                name: `Challenge with ${friend.name}`,
                                description: "Complete your habits every day!",
                              })
                              setCreateDialogOpen(true)
                            }}
                          >
                            Challenge
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button className="w-full">Add Friends</Button>
                <Button variant="outline" className="w-full">
                  Find Friends
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Friend Suggestions</CardTitle>
                <CardDescription>People you might know</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { name: "Alex Johnson", mutual: 3 },
                    { name: "Emma Williams", mutual: 2 },
                    { name: "Ryan Garcia", mutual: 5 },
                    { name: "Olivia Brown", mutual: 1 },
                  ].map((suggestion, index) => (
                    <div key={index} className="flex items-center justify-between border rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={`/placeholder.svg?height=40&width=40&text=${index}`}
                            alt={suggestion.name}
                          />
                          <AvatarFallback>{suggestion.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{suggestion.name}</p>
                          <p className="text-sm text-muted-foreground">{suggestion.mutual} mutual friends</p>
                        </div>
                      </div>
                      <Button size="sm">Add</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Your Achievements</CardTitle>
                <CardDescription>Badges and milestones you've earned</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { name: "Early Adopter", description: "Joined during beta", icon: "🚀", unlocked: true },
                    { name: "Streak Master", description: "Maintained a 7-day streak", icon: "🔥", unlocked: true },
                    { name: "Habit Enthusiast", description: "Created 5 habits", icon: "⭐", unlocked: true },
                    {
                      name: "Perfect Week",
                      description: "Completed all habits for a week",
                      icon: "🏆",
                      unlocked: false,
                    },
                    { name: "Social Butterfly", description: "Added 5 friends", icon: "🦋", unlocked: false },
                    { name: "Challenge Champion", description: "Won 3 challenges", icon: "🏅", unlocked: false },
                  ].map((achievement, index) => (
                    <div
                      key={index}
                      className={`rounded-lg border p-4 text-center ${achievement.unlocked ? "" : "opacity-50"}`}
                    >
                      <div className="text-3xl mb-2">{achievement.icon}</div>
                      <h4 className="font-medium">{achievement.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                      {achievement.unlocked ? (
                        <Badge className="mt-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900">
                          Unlocked
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="mt-2">
                          Locked
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

