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
import { Plus, CalendarDays, UserPlus, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, addDays, startOfWeek, eachDayOfInterval } from "date-fns";
import { Habit } from "@/lib/types";
import { motion } from "framer-motion";
import { SocialChallengesView, Friend } from "@/components/social-challenges-view";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart } from "lucide-react";

export default function DashboardHome() {
  const { user, loading, isDevelopmentMode } = useAuth();
  const router = useRouter();
  const { habits, toggleCompletion, deleteHabit, toggleFavorite, loadHabits } = useHabits();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("habits");
  const [activeFilter, setActiveFilter] = useState("all");
  const [mainTab, setMainTab] = useState("today");
  const [isAddFriendDialogOpen, setIsAddFriendDialogOpen] = useState(false);
  const [friendEmail, setFriendEmail] = useState("");
  const [socialSubTab, setSocialSubTab] = useState("friends");

  // Mock friends data for social section
  const mockFriends: Friend[] = [
    {
      id: "friend1",
      name: "Jane Smith",
      email: "jane@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "online",
      lastActive: new Date().toISOString()
    },
    {
      id: "friend2",
      name: "John Doe",
      email: "john@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "offline",
      lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Mock challenges data
  const mockChallenges = [
    {
      id: "challenge1",
      name: "10,000 Steps Challenge",
      description: "Walk 10,000 steps every day for a week",
      type: "steps",
      goal: 10000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdBy: "friend1",
      participants: [
        {
          userId: "friend1",
          progress: 8500,
          joinedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        {
          userId: user?.id || "user1",
          progress: 6000,
          joinedAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
        }
      ]
    }
  ];

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
      case "social":
        filtered = habits.filter(habit => habit.category === "social");
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

  // Social section functions
  const showToast = (title: string, description: string) => {
    toast({
      title,
      description,
      duration: 3000,
    });
  };

  const handleAddFriend = async () => {
    if (!user) {
      showToast("Authentication Error", "You must be logged in to add friends.");
      return;
    }
    
    if (!friendEmail.trim() || !friendEmail.includes('@')) {
      showToast("Invalid email", "Please enter a valid email address");
      return;
    }
    
    try {
      // In a real app, this would send an API request to add a friend
      console.log(`Adding friend with email: ${friendEmail}`);
      
      showToast("Friend request sent", `A friend request has been sent to ${friendEmail}`);
      setFriendEmail("");
      setIsAddFriendDialogOpen(false);
    } catch (error) {
      console.error("Error adding friend:", error);
      showToast("Error", "Failed to send friend request. Please try again.");
    }
  };

  const handleJoinChallenge = async (id: string) => {
    showToast("Challenge joined!", "You've successfully joined the challenge.");
  };

  const handleLeaveChallenge = async (id: string) => {
    showToast("Challenge left", "You've left the challenge.");
  };

  const handleCreateChallenge = async (
    name: string,
    description: string,
    type: string,
    goal: number,
    startDate: Date,
    endDate: Date
  ) => {
    if (!user) {
      showToast("Authentication Error", "You must be logged in to create challenges.");
      return;
    }
    
    try {
      // Validate inputs
      if (!name || !description || !type || !goal || !startDate || !endDate) {
        showToast("Validation Error", "Please fill all fields to create a challenge");
        return;
      }
      
      if (goal <= 0) {
        showToast("Validation Error", "Goal must be greater than zero");
        return;
      }
      
      if (endDate <= startDate) {
        showToast("Validation Error", "End date must be after start date");
        return;
      }
      
      // In a real app, this would create a challenge in the database
      console.log("Creating challenge:", { name, description, type, goal, startDate, endDate });
      
      showToast("Challenge created!", "Your new challenge has been created.");
      
      // Optionally refresh the challenges list
      // await loadChallenges();
    } catch (error) {
      console.error("Error creating challenge:", error);
      showToast("Error", "Failed to create challenge. Please try again.");
    }
  };

  const handleUpdateProgress = async (challengeId: string, progress: number) => {
    if (!user) {
      showToast("Authentication Error", "You must be logged in to update progress.");
      return;
    }
    
    try {
      // Validate inputs
      if (!challengeId) {
        showToast("Error", "Invalid challenge ID");
        return;
      }
      
      if (progress < 0) {
        showToast("Validation Error", "Progress cannot be negative");
        return;
      }
      
      // Find the challenge to get its goal value
      const challenge = mockChallenges.find(c => c.id === challengeId);
      if (challenge && progress > challenge.goal) {
        showToast("Warning", `Progress exceeds the goal of ${challenge.goal}`);
        // You might want to cap the progress at the goal value
        // progress = challenge.goal;
      }
      
      // In a real app, this would update the progress in the database
      console.log("Updating progress:", { challengeId, progress });
      
      showToast("Progress updated!", "Your challenge progress has been updated.");
    } catch (error) {
      console.error("Error updating progress:", error);
      showToast("Error", "Failed to update progress. Please try again.");
    }
  };

  // Adapt user data for our component
  const adaptedUser = user ? {
    id: user.id,
    name: user.user_metadata?.full_name || user.email,
    email: user.email
  } : { id: "", name: "", email: "" };

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
    
    // Set active tab based on URL parameter
    const tabParam = url.searchParams.get('tab');
    if (tabParam && ['habits', 'analytics', 'social'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 p-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/dashboard/add-habit')} className="gap-2">
            <Plus className="h-4 w-4" />
            New Habit
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="habits">Habits</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
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

        <TabsContent value="analytics">
          <DashboardAnalytics habits={habits} />
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-2xl font-bold tracking-tight">Social</h3>
              <p className="text-muted-foreground">Connect with friends and join challenges</p>
            </div>
            <Button className="gap-2" onClick={() => setIsAddFriendDialogOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Add Friend
            </Button>
          </div>

          <Tabs value={socialSubTab} onValueChange={setSocialSubTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="friends">Friends</TabsTrigger>
              <TabsTrigger value="challenges">Challenges</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="friends" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mockFriends.map((friend) => (
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
                            <span>Active</span>
                          </div>
                          <span className="font-medium">
                            {friend.lastActive ? new Date(friend.lastActive).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1">
                            <Heart className="h-4 w-4 text-red-500" />
                            <span>Email</span>
                          </div>
                          <span className="font-medium">{friend.email}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="challenges">
              <SocialChallengesView
                challenges={mockChallenges}
                friends={mockFriends}
                user={adaptedUser}
                loading={false}
                onJoinChallenge={handleJoinChallenge}
                onLeaveChallenge={handleLeaveChallenge}
                onCreateChallenge={handleCreateChallenge}
                onUpdateProgress={handleUpdateProgress}
              />
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>See what your friends have been up to</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground py-8">
                    Activity feed coming soon!
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Add Friend Dialog */}
          <Dialog open={isAddFriendDialogOpen} onOpenChange={setIsAddFriendDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add a Friend</DialogTitle>
                <DialogDescription>
                  Enter your friend's email address to send them a friend request.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="friend-email" className="text-right">Email</Label>
                  <Input
                    id="friend-email"
                    type="email"
                    placeholder="friend@example.com"
                    value={friendEmail}
                    onChange={(e) => setFriendEmail(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleAddFriend}>Send Friend Request</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}

