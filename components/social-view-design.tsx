import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Award, Medal, Trophy, Users } from "lucide-react"

export function SocialViewDesign() {
  // Mock data for design purposes
  const friends = [
    { id: 1, name: "Sarah Chen", avatar: "/placeholder.svg?height=40&width=40", streak: 14, score: 92 },
    { id: 2, name: "Michael Kim", avatar: "/placeholder.svg?height=40&width=40", streak: 7, score: 78 },
    { id: 3, name: "Jessica Taylor", avatar: "/placeholder.svg?height=40&width=40", streak: 3, score: 65 },
    { id: 4, name: "David Wilson", avatar: "/placeholder.svg?height=40&width=40", streak: 9, score: 84 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Social Challenges</h2>
        <p className="text-muted-foreground">Compete with friends and stay motivated</p>
      </div>

      <Tabs defaultValue="leaderboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-4">
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
                  .sort((a, b) => b.score - a.score)
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
                          <p className="text-sm font-medium">{friend.score} pts</p>
                        </div>
                        <Progress value={friend.score} max={100} className="h-2 mt-2" />
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
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Active Challenges</h3>
            <Button>Create Challenge</Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>30-Day Meditation Challenge</CardTitle>
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900">
                    Day 12/30
                  </Badge>
                </div>
                <CardDescription>Complete a 10-minute meditation every day</CardDescription>
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
                        <p className="text-sm">10/12 days</p>
                      </div>
                      <Progress value={83} className="h-2 mt-1" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={friends[0].avatar} alt={friends[0].name} />
                      <AvatarFallback>{friends[0].name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium">{friends[0].name}</p>
                        <p className="text-sm">12/12 days</p>
                      </div>
                      <Progress value={100} className="h-2 mt-1" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={friends[1].avatar} alt={friends[1].name} />
                      <AvatarFallback>{friends[1].name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium">{friends[1].name}</p>
                        <p className="text-sm">9/12 days</p>
                      </div>
                      <Progress value={75} className="h-2 mt-1" />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">View Details</Button>
                <Button
                  variant="ghost"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  Leave Challenge
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Weekly Reading Challenge</CardTitle>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900">
                    5 days left
                  </Badge>
                </div>
                <CardDescription>Read for at least 30 minutes every day</CardDescription>
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
                        <p className="text-sm">3/7 days</p>
                      </div>
                      <Progress value={43} className="h-2 mt-1" />
                    </div>
                  </div>
                  {friends.slice(0, 2).map((friend, index) => (
                    <div key={friend.id} className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={friend.avatar} alt={friend.name} />
                        <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium">{friend.name}</p>
                          <p className="text-sm">{[2, 4][index]}/7 days</p>
                        </div>
                        <Progress value={[29, 57][index]} className="h-2 mt-1" />
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
                >
                  Leave Challenge
                </Button>
              </CardFooter>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Challenge Ideas</CardTitle>
              <CardDescription>Popular challenges to try with friends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  "30-Day Fitness",
                  "Water Drinking",
                  "Early Bird",
                  "Digital Detox",
                  "Gratitude Journal",
                  "Learn a Skill",
                ].map((challenge, index) => (
                  <div key={index} className="rounded-lg border p-3 hover:bg-accent cursor-pointer transition-colors">
                    <h4 className="font-medium">{challenge}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {
                        [
                          "Exercise daily for a month",
                          "Drink 8 glasses daily",
                          "Wake up before 6am",
                          "Reduce screen time",
                          "Write daily gratitudes",
                          "Practice 20 min daily",
                        ][index]
                      }
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="friends" className="space-y-4">
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
                {friends.map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={friend.avatar} alt={friend.name} />
                        <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{friend.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {friend.streak > 0 ? `${friend.streak} day streak` : "No active streak"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {friend.streak >= 7 && <Award className="h-5 w-5 text-amber-500" title="7+ day streak" />}
                      <Button variant="outline" size="sm">
                        Challenge
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button className="w-full">Add Friends</Button>
              <Button variant="outline" className="w-full">
                Find Friends
              </Button>
            </CardFooter>
          </Card>

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
                        <AvatarImage src={`/placeholder.svg?height=40&width=40&text=${index}`} alt={suggestion.name} />
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
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
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
                  { name: "Perfect Week", description: "Completed all habits for a week", icon: "🏆", unlocked: false },
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
        </TabsContent>
      </Tabs>
    </div>
  )
}

