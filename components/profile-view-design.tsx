import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Award, Calendar, Edit, Mail, MapPin, Trophy, User } from "lucide-react"
import { LineChartDesign } from "./charts/line-chart-design"
import { HeatmapDesign } from "./charts/heatmap-design"

export function ProfileViewDesign() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex flex-col items-center md:items-start gap-4">
              <Avatar className="h-24 w-24 border-4 border-background">
                <AvatarImage src="/placeholder.svg?height=96&width=96" alt="User" />
                <AvatarFallback className="text-2xl">AJ</AvatarFallback>
              </Avatar>

              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold">Alex Johnson</h2>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">San Francisco, CA</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground mt-1">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">alex@example.com</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
                <Button variant="outline" size="sm">
                  Share Profile
                </Button>
              </div>
            </div>

            <div className="flex-1 w-full space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">42</div>
                  <div className="text-sm text-muted-foreground">Total Habits</div>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">14</div>
                  <div className="text-sm text-muted-foreground">Day Streak</div>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">87%</div>
                  <div className="text-sm text-muted-foreground">Completion</div>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">8</div>
                  <div className="text-sm text-muted-foreground">Achievements</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Trophy className="h-3 w-3" />
                  Streak Master
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Award className="h-3 w-3" />
                  Early Bird
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  90 Days
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <User className="h-3 w-3" />
                  Social Butterfly
                </Badge>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Current Goals</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <div className="text-sm">Meditation Streak: 30 days</div>
                      <div className="text-sm font-medium">47%</div>
                    </div>
                    <Progress value={47} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <div className="text-sm">Read 12 books this year</div>
                      <div className="text-sm font-medium">75%</div>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your habit activity over the past 30 days</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <HeatmapDesign height={300} />
            </CardContent>
          </Card>

          <div className="space-y-4">
            {[
              {
                date: "Today",
                activities: [
                  { time: "8:30 AM", action: "Completed Morning Meditation", icon: "🧘" },
                  { time: "12:45 PM", action: "Completed Drink Water", icon: "💧" },
                  { time: "3:20 PM", action: "Started a new challenge with Sarah", icon: "🏆" },
                ],
              },
              {
                date: "Yesterday",
                activities: [
                  { time: "7:15 AM", action: "Completed Morning Run", icon: "🏃" },
                  { time: "9:30 AM", action: "Earned 'Early Bird' achievement", icon: "🏅" },
                  { time: "8:45 PM", action: "Completed Reading", icon: "📚" },
                ],
              },
            ].map((day, dayIndex) => (
              <div key={dayIndex} className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">{day.date}</h3>
                <Card>
                  <CardContent className="p-0">
                    {day.activities.map((activity, actIndex) => (
                      <div
                        key={actIndex}
                        className={`flex items-start gap-3 p-4 ${
                          actIndex !== day.activities.length - 1 ? "border-b" : ""
                        }`}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                          <span>{activity.icon}</span>
                        </div>
                        <div>
                          <p className="font-medium">{activity.action}</p>
                          <p className="text-sm text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Habit Completion Over Time</CardTitle>
              <CardDescription>Your progress over the past 6 months</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <LineChartDesign height={300} />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Habits</CardTitle>
                <CardDescription>Your most consistent habits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Morning Meditation", completion: 92, icon: "🧘" },
                    { name: "Read 30 minutes", completion: 86, icon: "📚" },
                    { name: "Drink Water", completion: 78, icon: "💧" },
                    { name: "Exercise", completion: 65, icon: "💪" },
                  ].map((habit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <span>{habit.icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium">{habit.name}</p>
                          <p className="text-sm font-medium">{habit.completion}%</p>
                        </div>
                        <Progress value={habit.completion} className="h-2 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Improvement Areas</CardTitle>
                <CardDescription>Habits that need more consistency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Journal Writing", completion: 45, icon: "✏️" },
                    { name: "Early Sleep", completion: 38, icon: "😴" },
                    { name: "Learn Spanish", completion: 32, icon: "🗣️" },
                    { name: "Stretching", completion: 28, icon: "🤸" },
                  ].map((habit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <span>{habit.icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium">{habit.name}</p>
                          <p className="text-sm font-medium">{habit.completion}%</p>
                        </div>
                        <Progress value={habit.completion} className="h-2 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
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
                  { name: "Early Adopter", description: "Joined during beta", icon: "🚀", date: "Jan 15, 2025" },
                  { name: "Streak Master", description: "Maintained a 7-day streak", icon: "🔥", date: "Feb 3, 2025" },
                  { name: "Habit Enthusiast", description: "Created 5 habits", icon: "⭐", date: "Feb 10, 2025" },
                  { name: "Social Butterfly", description: "Added 5 friends", icon: "🦋", date: "Feb 18, 2025" },
                  {
                    name: "Challenge Winner",
                    description: "Won your first challenge",
                    icon: "🏆",
                    date: "Feb 28, 2025",
                  },
                  {
                    name: "Perfect Week",
                    description: "Completed all habits for a week",
                    icon: "🏅",
                    date: "Mar 7, 2025",
                  },
                  { name: "Mindfulness Guru", description: "30 days of meditation", icon: "🧘", date: "Mar 12, 2025" },
                  { name: "Book Worm", description: "Read for 30 days straight", icon: "📚", date: "Mar 15, 2025" },
                ].map((achievement, index) => (
                  <div key={index} className="rounded-lg border p-4">
                    <div className="text-3xl mb-2">{achievement.icon}</div>
                    <h4 className="font-medium">{achievement.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                    <div className="text-xs text-muted-foreground mt-3">Earned on {achievement.date}</div>
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

