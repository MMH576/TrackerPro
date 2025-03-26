"use client";

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
import { useToast } from "@/components/ui/use-toast";
import { PomodoroTimer } from "@/components/pomodoro-timer";
import { usePomodoroContext } from "@/contexts/pomodoro-context";

export default function DashboardHome() {
  const { user, loading, isDevelopmentMode } = useAuth();
  const router = useRouter();
  const { habits, toggleCompletion, deleteHabit, toggleFavorite, loadHabits } = useHabits();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("habits");
  const [activeFilter, setActiveFilter] = useState("all");
  const [mainTab, setMainTab] = useState("today");

  // Check for URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    
    if (tabParam && ['habits', 'analytics', 'pomodoro'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <div className="ml-4">Loading user data...</div>
      </div>
    );
  }

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
      case "all":
      default:
        filtered = habits;
        break;
    }
    
    return filtered;
  };

  // Get habits that are due on a specific date
  const isHabitDueOnDate = (habit: Habit, date: Date) => {
    const dayOfWeek = date.getDay();
    
    // Convert Sunday from 0 to 7 for consistency with our data model
    const adjustedDayOfWeek = dayOfWeek === 0 ? "0" : dayOfWeek.toString();
    
    // All daily habits are due every day
    if (habit.frequency === "daily") return true;
    
    // Weekday habits are due Monday-Friday
    if (habit.frequency === "weekdays") return dayOfWeek >= 1 && dayOfWeek <= 5;
    
    // Weekend habits are due Saturday-Sunday
    if (habit.frequency === "weekends") return dayOfWeek === 0 || dayOfWeek === 6;
    
    // Weekly habits are due on specific days
    if (habit.frequency === "weekly" && habit.days && Array.isArray(habit.days)) {
      const isDue = habit.days.includes(adjustedDayOfWeek);
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
      { id: "health", name: "Health", icon: "💪", color: "bg-green-500" },
      { id: "productivity", name: "Productivity", icon: "⚡", color: "bg-yellow-500" },
      { id: "learning", name: "Learning", icon: "📚", color: "bg-blue-500" },
      { id: "finance", name: "Finance", icon: "💰", color: "bg-emerald-500" },
      { id: "creativity", name: "Creativity", icon: "🎨", color: "bg-purple-500" }
    ];
    
    return categories;
  };

  // Show toast notification
  const showToast = (title: string, description: string) => {
    toast({
      title,
      description,
      duration: 3000,
    });
  };

  // Adapt user data for components
  const adaptedUser = user ? {
    id: user.id,
    name: user.user_metadata?.full_name || user.email,
    email: user.email
  } : { id: "", name: "", email: "" };

  // Load habits data
  useEffect(() => {
    if (user) {
      loadHabits();
    }
  }, [user, loadHabits]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update URL query parameter
    const url = new URL(window.location.href);
    url.searchParams.set('tab', value);
    window.history.pushState({}, '', url.toString());
  };

  // Update document title when active tab changes
  useEffect(() => {
    // Set document title based on the active tab
    const titles = {
      habits: "Habits | Habit Tracker Pro",
      pomodoro: "Pomodoro Timer | Habit Tracker Pro",
      analytics: "Analytics | Habit Tracker Pro"
    };
    
    document.title = titles[activeTab as keyof typeof titles] || "Habit Tracker Pro";
  }, [activeTab]);

  // Connect with Pomodoro context
  const { setIsOnPomodoroPage } = usePomodoroContext();
  
  // Update Pomodoro context when tab changes
  useEffect(() => {
    // Update the pomodoro context when the pomodoro tab is active
    setIsOnPomodoroPage(activeTab === 'pomodoro');
  }, [activeTab, setIsOnPomodoroPage]);

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Habit Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track and manage your daily habits</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/dashboard/add-habit')} className="gap-2">
            <Plus className="h-4 w-4" />
            New Habit
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="habits">Habits</TabsTrigger>
          <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="habits" className="space-y-4">
          <ProgressIndicator value={calculateTodayProgress()} label="Today's Progress" />
          
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant={activeFilter === "all" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setActiveFilter("all")}
              >
                All Habits
              </Button>
              <Button 
                variant={activeFilter === "today" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setActiveFilter("today")}
              >
                Today
              </Button>
              <Button 
                variant={activeFilter === "favorites" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setActiveFilter("favorites")}
              >
                Favorites
              </Button>
              <Button 
                variant={activeFilter === "completed" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setActiveFilter("completed")}
              >
                Completed
              </Button>
            </div>
            
            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {getFilteredHabits().map(habit => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    onToggleCompletion={() => toggleCompletion(habit.id)}
                    onDelete={() => deleteHabit(habit.id)}
                    onToggleFavorite={() => toggleFavorite(habit.id)}
                  />
                ))}
                
                {getFilteredHabits().length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <p className="text-muted-foreground mb-4">No habits found for this filter</p>
                    <Button onClick={() => router.push('/dashboard/add-habit')}>Create a New Habit</Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <DashboardAnalytics habits={habits} />
        </TabsContent>

        <TabsContent value="pomodoro" className="space-y-4">
          <PomodoroTimer />
        </TabsContent>
      </Tabs>
    </div>
  );
}

