import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Bell, Calendar, Clock, Palette } from "lucide-react"

export function AddHabitViewDesign() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Add New Habit</h2>
          <p className="text-muted-foreground">Create a new habit to track</p>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Habit Details</CardTitle>
              <CardDescription>Basic information about your habit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="habit-name">Habit Name*</Label>
                <Input id="habit-name" placeholder="e.g., Morning Meditation" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="habit-description">Description (Optional)</Label>
                <Textarea
                  id="habit-description"
                  placeholder="e.g., 10 minutes of mindfulness meditation each morning"
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="habit-category">Category</Label>
                <Select defaultValue="mindfulness">
                  <SelectTrigger id="habit-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="health">Health & Fitness</SelectItem>
                    <SelectItem value="learning">Learning</SelectItem>
                    <SelectItem value="productivity">Productivity</SelectItem>
                    <SelectItem value="mindfulness">Mindfulness</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="creativity">Creativity</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Habit Type</Label>
                <RadioGroup defaultValue="yes-no" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="yes-no" id="yes-no" />
                    <Label htmlFor="yes-no" className="flex-1 cursor-pointer">
                      <div className="font-medium">Yes or No</div>
                      <div className="text-sm text-muted-foreground">Simple completion tracking</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="counter" id="counter" />
                    <Label htmlFor="counter" className="flex-1 cursor-pointer">
                      <div className="font-medium">Counter</div>
                      <div className="text-sm text-muted-foreground">Track quantity (e.g., glasses of water)</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="timer" id="timer" />
                    <Label htmlFor="timer" className="flex-1 cursor-pointer">
                      <div className="font-medium">Timer</div>
                      <div className="text-sm text-muted-foreground">Track duration (e.g., minutes of reading)</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="habit-goal">Daily Goal</Label>
                <div className="flex items-center gap-2">
                  <Input id="habit-goal" type="number" defaultValue="1" className="w-24" />
                  <span className="text-muted-foreground">times per day</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule
              </CardTitle>
              <CardDescription>When do you want to perform this habit?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Frequency</Label>
                <RadioGroup defaultValue="daily" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="daily" id="daily" />
                    <Label htmlFor="daily" className="flex-1 cursor-pointer">
                      <div className="font-medium">Daily</div>
                      <div className="text-sm text-muted-foreground">Every day</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="weekly" id="weekly" />
                    <Label htmlFor="weekly" className="flex-1 cursor-pointer">
                      <div className="font-medium">Weekly</div>
                      <div className="text-sm text-muted-foreground">Specific days of the week</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="weekdays" id="weekdays" />
                    <Label htmlFor="weekdays" className="flex-1 cursor-pointer">
                      <div className="font-medium">Weekdays</div>
                      <div className="text-sm text-muted-foreground">Monday to Friday</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="weekends" id="weekends" />
                    <Label htmlFor="weekends" className="flex-1 cursor-pointer">
                      <div className="font-medium">Weekends</div>
                      <div className="text-sm text-muted-foreground">Saturday and Sunday</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom" className="flex-1 cursor-pointer">
                      <div className="font-medium">Custom</div>
                      <div className="text-sm text-muted-foreground">Choose specific days</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              <div className="grid gap-2">
                <Label>Days of the Week</Label>
                <div className="flex flex-wrap gap-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                    <Button key={index} variant={index < 5 ? "default" : "outline"} className="w-12 h-12 rounded-full">
                      {day}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid gap-2">
                <Label htmlFor="time-of-day">Preferred Time of Day</Label>
                <Select defaultValue="morning">
                  <SelectTrigger id="time-of-day">
                    <SelectValue placeholder="Select time of day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                    <SelectItem value="anytime">Anytime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reminders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Reminders
              </CardTitle>
              <CardDescription>Set up reminders for your habit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="reminder-toggle">Enable Reminders</Label>
                  <p className="text-sm text-muted-foreground">Get notifications to complete this habit</p>
                </div>
                <Switch id="reminder-toggle" defaultChecked />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="reminder-time">Reminder Time</Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input id="reminder-time" type="time" defaultValue="08:00" className="w-32" />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="missed-reminder">Missed Habit Reminder</Label>
                  <p className="text-sm text-muted-foreground">Get a reminder if you haven't completed the habit</p>
                </div>
                <Switch id="missed-reminder" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="missed-time">Reminder Time</Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input id="missed-time" type="time" defaultValue="21:00" className="w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>Customize how your habit looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Icon</Label>
                <div className="flex flex-wrap gap-3">
                  {["🧘", "💪", "📚", "💧", "🏃", "🥗", "💤", "💰", "✏️", "🎵", "🧠", "🌱"].map((icon, index) => (
                    <Button key={index} variant={index === 0 ? "default" : "outline"} className="w-12 h-12 text-xl">
                      {icon}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid gap-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-3">
                  {[
                    "bg-red-500",
                    "bg-orange-500",
                    "bg-amber-500",
                    "bg-yellow-500",
                    "bg-lime-500",
                    "bg-green-500",
                    "bg-emerald-500",
                    "bg-teal-500",
                    "bg-cyan-500",
                    "bg-blue-500",
                    "bg-indigo-500",
                    "bg-violet-500",
                    "bg-purple-500",
                    "bg-fuchsia-500",
                    "bg-pink-500",
                    "bg-rose-500",
                  ].map((color, index) => (
                    <div
                      key={index}
                      className={`w-8 h-8 rounded-full ${color} cursor-pointer ${index === 9 ? "ring-2 ring-offset-2 ring-blue-500" : ""}`}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Create Habit</Button>
      </div>
    </div>
  )
}

