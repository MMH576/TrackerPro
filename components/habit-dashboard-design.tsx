import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Plus, Trash2, Trophy } from "lucide-react"

export function HabitDashboardDesign() {
  // Mock data for design purposes
  const habits = [
    {
      id: 1,
      name: "Morning Meditation",
      description: "10 minutes of mindfulness",
      category: "mindfulness",
      streak: 5,
      completed: true,
      progress: 71,
      icon: "🧘",
    },
    {
      id: 2,
      name: "Read 30 minutes",
      description: "Read books or articles",
      category: "learning",
      streak: 12,
      completed: true,
      progress: 86,
      icon: "📚",
    },
    {
      id: 3,
      name: "Drink 8 glasses of water",
      description: "Stay hydrated throughout the day",
      category: "health",
      streak: 3,
      completed: false,
      progress: 43,
      icon: "💧",
    },
    {
      id: 4,
      name: "Exercise",
      description: "30 minutes of physical activity",
      category: "health",
      streak: 7,
      completed: false,
      progress: 50,
      icon: "💪",
    },
    {
      id: 5,
      name: "Practice coding",
      description: "Work on personal projects",
      category: "learning",
      streak: 9,
      completed: true,
      progress: 65,
      icon: "💻",
    },
  ]

  const completionRate = 60 // Mock completion rate

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Habits</h2>
          <p className="text-muted-foreground">Track your daily habits and build consistency</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-muted p-3 rounded-lg">
            <div className="text-sm font-medium text-muted-foreground">Today's Progress</div>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{completionRate}%</div>
              <Progress value={completionRate} className="w-24 h-2" />
            </div>
          </div>

          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Habit
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Habits</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {habits.map((habit) => (
              <Card
                key={habit.id}
                className={
                  habit.completed ? "border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20" : ""
                }
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="text-xl" aria-hidden="true">
                        {habit.icon}
                      </span>
                      <CardTitle className="text-lg">{habit.name}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                  {habit.description && <CardDescription>{habit.description}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <div className="text-sm font-medium">
                      {habit.streak > 0 ? `${habit.streak} day streak` : "Start your streak today!"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-sm text-muted-foreground">Monthly progress:</div>
                    <div className="text-sm font-medium">{habit.progress}%</div>
                  </div>
                  <Progress value={habit.progress} className="h-2" />
                </CardContent>
                <CardFooter>
                  <Button variant={habit.completed ? "outline" : "default"} className="w-full gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${habit.completed ? "text-green-500" : ""}`} />
                    {habit.completed ? "Completed Today" : "Mark as Complete"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[
              "Health & Fitness",
              "Learning",
              "Mindfulness",
              "Productivity",
              "Finance",
              "Creativity",
              "Social",
              "Other",
            ].map((category, index) => (
              <Card key={index} className="hover:bg-accent cursor-pointer transition-colors">
                <CardHeader className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <span className="text-3xl mb-2">{["💪", "📚", "🧘", "⏱️", "💰", "🎨", "👥", "✨"][index]}</span>
                    <CardTitle className="text-base">{category}</CardTitle>
                    <Badge variant="outline" className="mt-2">
                      {Math.floor(Math.random() * 5) + 1} habits
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="today" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {habits.slice(0, 3).map((habit) => (
              <Card
                key={habit.id}
                className={
                  habit.completed ? "border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20" : ""
                }
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="text-xl" aria-hidden="true">
                        {habit.icon}
                      </span>
                      <CardTitle className="text-lg">{habit.name}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                  {habit.description && <CardDescription>{habit.description}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <div className="text-sm font-medium">
                      {habit.streak > 0 ? `${habit.streak} day streak` : "Start your streak today!"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-sm text-muted-foreground">Monthly progress:</div>
                    <div className="text-sm font-medium">{habit.progress}%</div>
                  </div>
                  <Progress value={habit.progress} className="h-2" />
                </CardContent>
                <CardFooter>
                  <Button variant={habit.completed ? "outline" : "default"} className="w-full gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${habit.completed ? "text-green-500" : ""}`} />
                    {habit.completed ? "Completed Today" : "Mark as Complete"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="favorites" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {habits.slice(1, 3).map((habit) => (
              <Card
                key={habit.id}
                className={
                  habit.completed ? "border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20" : ""
                }
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="text-xl" aria-hidden="true">
                        {habit.icon}
                      </span>
                      <CardTitle className="text-lg">{habit.name}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                  {habit.description && <CardDescription>{habit.description}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <div className="text-sm font-medium">
                      {habit.streak > 0 ? `${habit.streak} day streak` : "Start your streak today!"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-sm text-muted-foreground">Monthly progress:</div>
                    <div className="text-sm font-medium">{habit.progress}%</div>
                  </div>
                  <Progress value={habit.progress} className="h-2" />
                </CardContent>
                <CardFooter>
                  <Button variant={habit.completed ? "outline" : "default"} className="w-full gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${habit.completed ? "text-green-500" : ""}`} />
                    {habit.completed ? "Completed Today" : "Mark as Complete"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

