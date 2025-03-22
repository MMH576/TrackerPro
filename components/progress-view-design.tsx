import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChartDesign } from "./charts/line-chart-design"
import { BarChartDesign } from "./charts/bar-chart-design"
import { HeatmapDesign } from "./charts/heatmap-design"

export function ProgressViewDesign() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Progress Insights</h2>
          <p className="text-muted-foreground">Track your habit completion over time</p>
        </div>

        <div className="flex items-center gap-2">
          <Select defaultValue="30days">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="year">This year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">68%</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
                <div className="mt-4 h-[120px]">
                  <LineChartDesign />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">14 days</div>
                <p className="text-xs text-muted-foreground">Your longest streak: 21 days</p>
                <div className="mt-4 h-[120px]">
                  <BarChartDesign />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Most Consistent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">Morning Meditation</div>
                <p className="text-xs text-muted-foreground">92% completion rate</p>
                <div className="mt-4 h-[120px]">
                  <HeatmapDesign />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Overview</CardTitle>
              <CardDescription>Your habit completion over the past 30 days</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <LineChartDesign height={300} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Habit Completion Trends</CardTitle>
              <CardDescription>See how your habit completion has changed over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <LineChartDesign height={400} />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Patterns</CardTitle>
                <CardDescription>Your most and least productive days</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <BarChartDesign height={300} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Time of Day Analysis</CardTitle>
                <CardDescription>When you're most likely to complete habits</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <BarChartDesign height={300} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Habit Calendar</CardTitle>
              <CardDescription>Days when you completed at least one habit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center p-4">
                <Calendar
                  mode="multiple"
                  selected={[
                    new Date(2025, 2, 1),
                    new Date(2025, 2, 2),
                    new Date(2025, 2, 3),
                    new Date(2025, 2, 5),
                    new Date(2025, 2, 6),
                    new Date(2025, 2, 7),
                    new Date(2025, 2, 8),
                    new Date(2025, 2, 9),
                    new Date(2025, 2, 10),
                    new Date(2025, 2, 11),
                    new Date(2025, 2, 12),
                    new Date(2025, 2, 15),
                    new Date(2025, 2, 16),
                  ]}
                  className="rounded-md border"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Yearly View</CardTitle>
              <CardDescription>Your habit completion throughout the year</CardDescription>
            </CardHeader>
            <CardContent className="h-[200px]">
              <HeatmapDesign height={200} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completion by Category</CardTitle>
              <CardDescription>How you're doing across different habit categories</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <BarChartDesign height={400} />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {["Health & Fitness", "Learning", "Mindfulness", "Productivity"].map((category, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{category}</CardTitle>
                    <Badge variant="outline" className="font-normal">
                      {[75, 62, 88, 54][index]}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    {[3, 2, 1, 4][index]}/{[4, 3, 1, 6][index]} habits
                  </div>
                  <div className="h-[100px]">
                    <LineChartDesign height={100} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

