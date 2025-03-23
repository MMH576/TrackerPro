'use client';

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useHabits } from "@/hooks/use-habits";
import { Button } from "@/components/ui/button";
import { MainTabs } from "@/components/main-tabs";
import { HabitFilters } from "@/components/habit-filters";
import { ProgressIndicator } from "@/components/progress-indicator";
import { HabitCard } from "@/components/habit-card";
import { DashboardAnalytics } from "@/components/dashboard-analytics";
import { Plus, CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, addDays, startOfWeek, eachDayOfInterval } from "date-fns";
import { Habit } from "@/lib/types";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { habits, toggleCompletion, deleteHabit, toggleFavorite, loadHabits } = useHabits();
  const [activeTab, setActiveTab] = useState("habits");
  const [activeFilter, setActiveFilter] = useState("all");
  const [mainTab, setMainTab] = useState("today");

  // Calculate today's progress
  const calculateTodayProgress = () => {
    if (habits.length === 0) return 0;
    const today = new Date().toISOString().split("T")[0];
    const completedToday = habits.filter(habit => 
      habit.completedDates.includes(today)
    ).length;
    
    return Math.round((completedToday / habits.length) * 100);
  };

  // Filter habits based on the active filter
  const getFilteredHabits = () => {
    const today = new Date().toISOString().split("T")[0];
    
    console.log("Active filter:", activeFilter);
    console.log("Categories in habits:", habits.map(h => h.category));
    
    let filtered;
    switch (activeFilter) {
      case "today":
        filtered = habits.filter(habit => 
          habit.frequency === "daily" || 
          (habit.frequency === "weekdays" && [1, 2, 3, 4, 5].includes(new Date().getDay())) ||
          (habit.frequency === "weekends" && [0, 6].includes(new Date().getDay()))
        );
        break;
      case "favorites":
        filtered = habits.filter(habit => habit.isFavorite);
        break;
      case "completed":
        filtered = habits.filter(habit => habit.completedDates.includes(today));
        break;
      case "health":
        filtered = habits.filter(habit => habit.category === "health");
        break;
      case "mindfulness":
        filtered = habits.filter(habit => habit.category === "mindfulness");
        break;
      case "productivity":
        filtered = habits.filter(habit => habit.category === "productivity");
        break;
      case "learning":
        filtered = habits.filter(habit => habit.category === "learning");
        break;
      case "finance":
        filtered = habits.filter(habit => habit.category === "finance");
        break;
      case "creativity":
        filtered = habits.filter(habit => habit.category === "creativity");
        break;
      case "social":
        filtered = habits.filter(habit => habit.category === "social");
        break;
      case "all":
      default:
        filtered = habits;
        break;
    }
    
    console.log("Filtered habits:", filtered.length, filtered.map(h => h.name));
    return filtered;
  };

  // Get habits that are due on a specific date
  const isHabitDueOnDate = (habit: Habit, date: Date) => {
    const dayOfWeek = date.getDay();
    
    // Convert Sunday from 0 to 7 for consistency with our data model
    const adjustedDayOfWeek = dayOfWeek === 0 ? "0" : dayOfWeek.toString();
    
    console.log(`Checking habit "${habit.name}" for date ${date.toDateString()}, day: ${adjustedDayOfWeek}`);
    console.log(`Frequency: ${habit.frequency}, Days: ${habit.days ? JSON.stringify(habit.days) : 'none'}`);
    
    // All daily habits are due every day
    if (habit.frequency === "daily") return true;
    
    // Weekday habits are due Monday-Friday
    if (habit.frequency === "weekdays") return dayOfWeek >= 1 && dayOfWeek <= 5;
    
    // Weekend habits are due Saturday-Sunday
    if (habit.frequency === "weekends") return dayOfWeek === 0 || dayOfWeek === 6;
    
    // Weekly habits are due on specific days
    if (habit.frequency === "weekly" && habit.days && Array.isArray(habit.days)) {
      const isDue = habit.days.includes(adjustedDayOfWeek);
      console.log(`Weekly habit check: ${isDue ? 'Due' : 'Not due'} on day ${adjustedDayOfWeek}`);
      return isDue;
    }
    
    return false;
  };
  
  // Check if a habit was completed on a specific date
  const wasHabitCompletedOnDate = (habit: Habit, date: Date) => {
    const dateString = date.toISOString().split("T")[0];
    return habit.completedDates.includes(dateString);
  };

  // State for the weekly view
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Calculate days for the week view
  const startOfCurrentWeek = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
    start: startOfCurrentWeek,
    end: addDays(startOfCurrentWeek, 6)
  });

  // Get habits by category for the categories view
  const getHabitsByCategory = () => {
    const categories = [
      { id: "mindfulness", name: "Mindfulness", icon: "🧘", color: "bg-orange-500" },
      { id: "learning", name: "Learning", icon: "📚", color: "bg-blue-500" },
      { id: "health", name: "Health & Fitness", icon: "💪", color: "bg-green-500" },
      { id: "productivity", name: "Productivity", icon: "⏱️", color: "bg-purple-500" },
      { id: "finance", name: "Finance", icon: "💰", color: "bg-yellow-500" },
      { id: "creativity", name: "Creativity", icon: "🎨", color: "bg-pink-500" },
      { id: "social", name: "Social", icon: "👥", color: "bg-indigo-500" }
    ];
    
    return categories.map(category => {
      const categoryHabits = habits.filter(habit => habit.category === category.id);
      return {
        ...category,
        count: categoryHabits.length,
        habits: categoryHabits
      };
    }).filter(category => category.count > 0);
  };

  // Add an effect to reload habits when the component mounts
  useEffect(() => {
    const loadHabitsData = async () => {
      console.log("Dashboard: Loading habits data");
      await loadHabits();
      console.log("Dashboard: Habits data loaded successfully");
    };
    
    loadHabitsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add searchParams logging
  useEffect(() => {
    const url = new URL(window.location.href);
    const refreshParam = url.searchParams.get('refresh');
    if (refreshParam) {
      console.log(`Dashboard: Detected refresh parameter: ${refreshParam}`);
      loadHabits();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Tabs
          defaultValue="habits"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="border-b mb-6">
            <TabsList className="w-full justify-start bg-transparent">
              <TabsTrigger 
                value="habits" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none pb-2 px-6"
              >
                Habits
              </TabsTrigger>
              <TabsTrigger 
                value="progress" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none pb-2 px-6"
              >
                Progress
              </TabsTrigger>
              <TabsTrigger 
                value="social" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none pb-2 px-6"
              >
                Social
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none pb-2 px-6"
              >
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="habits" className="mt-0 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold">My Habits</h1>
                <p className="text-muted-foreground">Track your daily habits and build consistency</p>
              </div>
              <div className="flex items-center gap-4">
                <ProgressIndicator 
                  label="Today's Progress" 
                  value={calculateTodayProgress()} 
                />
                <Button onClick={() => router.push('/dashboard/add-habit')}>
                  <Plus className="mr-2 h-4 w-4" /> Add Habit
                </Button>
                <Button variant="outline" onClick={() => router.push('/dashboard/advanced')}>
                  Advanced
                </Button>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                <Button
                  variant={activeFilter === "all" ? "default" : "outline"}
                  className="flex-shrink-0 px-4 py-2 h-auto transition-all"
                  onClick={() => setActiveFilter("all")}
                >
                  <span className="mr-2">✨</span>
                  All Habits
                </Button>
                <Button
                  variant={activeFilter === "today" ? "default" : "outline"}
                  className="flex-shrink-0 px-4 py-2 h-auto transition-all"
                  onClick={() => setActiveFilter("today")}
                >
                  <span className="mr-2">📅</span>
                  Today
                </Button>
                <Button
                  variant={activeFilter === "favorites" ? "default" : "outline"}
                  className="flex-shrink-0 px-4 py-2 h-auto transition-all"
                  onClick={() => setActiveFilter("favorites")}
                >
                  <span className="mr-2">⭐</span>
                  Favorites
                </Button>
                <Button
                  variant={activeFilter === "completed" ? "default" : "outline"}
                  className="flex-shrink-0 px-4 py-2 h-auto transition-all"
                  onClick={() => setActiveFilter("completed")}
                >
                  <span className="mr-2">✅</span>
                  Completed
                </Button>
                <Button
                  variant={activeFilter === "categories" ? "default" : "outline"}
                  className="flex-shrink-0 px-4 py-2 h-auto transition-all"
                  onClick={() => setActiveFilter("categories")}
                >
                  <span className="mr-2">📂</span>
                  Categories
                </Button>
              </div>
            </div>
            
            {activeFilter === "categories" ? (
              <motion.div 
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1 }}
              >
                {getHabitsByCategory().map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="border hover:border-primary/50 cursor-pointer transition-all hover:shadow-md" onClick={() => setActiveFilter(category.id)}>
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center space-y-3">
                          <div className={`w-16 h-16 ${category.color} rounded-full flex items-center justify-center text-white text-2xl`}>
                            {category.icon}
                          </div>
                          <h3 className="text-xl font-semibold">{category.name}</h3>
                          <Badge variant="secondary" className="px-3 py-1">
                            {category.count} {category.count === 1 ? 'habit' : 'habits'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {getHabitsByCategory().length === 0 && (
                  <div className="col-span-full rounded-lg border bg-card p-6 text-center">
                    <h3 className="text-lg font-semibold mb-2">No categories found</h3>
                    <p className="text-muted-foreground mb-4">
                      You haven't created any habits yet. Get started by adding your first habit!
                    </p>
                    <Button onClick={() => router.push('/dashboard/add-habit')}>
                      <Plus className="mr-2 h-4 w-4" /> Add Habit
                    </Button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.05 }}
              >
                {getFilteredHabits().map((habit, index) => (
                  <motion.div
                    key={habit.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <HabitCard
                      habit={habit}
                      onToggleCompletion={toggleCompletion}
                      onDelete={deleteHabit}
                      onToggleFavorite={toggleFavorite}
                    />
                  </motion.div>
                ))}
                
                {getFilteredHabits().length === 0 && (
                  <div className="col-span-full rounded-lg border bg-card p-6 text-center">
                    <h3 className="text-lg font-semibold mb-2">No habits found</h3>
                    <p className="text-muted-foreground mb-4">
                      {activeFilter === "all" 
                        ? "You haven't created any habits yet. Get started by adding your first habit!" 
                        : `No habits match the "${activeFilter}" filter. Try creating a habit in this category.`}
                    </p>
                    <Button onClick={() => router.push('/dashboard/add-habit')}>
                      <Plus className="mr-2 h-4 w-4" /> Add Habit
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold">Progress Insights</h1>
                <p className="text-muted-foreground">Track your habit completion over time</p>
              </div>
            </div>
            <DashboardAnalytics habits={habits} />
          </TabsContent>

          <TabsContent value="social">
            <div>
              <h1 className="text-3xl font-bold mb-6">Social</h1>
              <p>Social features will appear here.</p>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div>
              <h1 className="text-3xl font-bold mb-6">Settings</h1>
              <p>Settings will appear here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

