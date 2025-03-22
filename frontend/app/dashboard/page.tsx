'use client';

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useHabits } from "@/hooks/use-habits";
import { Button } from "@/components/ui/button";
import { MainTabs } from "@/components/main-tabs";
import { HabitFilters } from "@/components/habit-filters";
import { ProgressIndicator } from "@/components/progress-indicator";
import { HabitCard } from "@/components/habit-card";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { habits, toggleCompletion, deleteHabit, toggleFavorite } = useHabits();
  const [activeTab, setActiveTab] = useState("habits");
  const [activeFilter, setActiveFilter] = useState("all");

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
    
    switch (activeFilter) {
      case "today":
        return habits.filter(habit => 
          habit.frequency === "daily" || 
          (habit.frequency === "weekdays" && [1, 2, 3, 4, 5].includes(new Date().getDay())) ||
          (habit.frequency === "weekends" && [0, 6].includes(new Date().getDay()))
        );
      case "favorites":
        return habits.filter(habit => habit.isFavorite);
      case "completed":
        return habits.filter(habit => habit.completedDates.includes(today));
      default:
        return habits;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <MainTabs 
          activeTab={activeTab} 
          onChange={setActiveTab} 
        />
      </div>
      
      {activeTab === "habits" && (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">My Habits</h1>
              <p className="text-muted-foreground">Track your daily habits and build consistency</p>
            </div>
            <div className="flex gap-4">
              <ProgressIndicator 
                label="Today's Progress" 
                value={calculateTodayProgress()} 
              />
              <Button onClick={() => router.push('/dashboard/add-habit')}>
                <Plus className="mr-2 h-4 w-4" /> Add Habit
              </Button>
            </div>
          </div>
          
          <div className="mb-6">
            <HabitFilters
              activeFilter={activeFilter}
              onChange={setActiveFilter}
            />
          </div>
          
          {activeFilter === "categories" ? (
            <div>Category view placeholder</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getFilteredHabits().map(habit => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onToggleCompletion={toggleCompletion}
                  onDelete={deleteHabit}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
              
              {getFilteredHabits().length === 0 && (
                <div className="col-span-full rounded-lg border bg-card p-6 text-center">
                  <h3 className="text-lg font-semibold mb-2">No habits found</h3>
                  <p className="text-muted-foreground mb-4">
                    {activeFilter === "all" 
                      ? "You haven't created any habits yet. Get started by adding your first habit!" 
                      : `No habits match the "${activeFilter}" filter.`}
                  </p>
                  <Button onClick={() => router.push('/dashboard/add-habit')}>
                    <Plus className="mr-2 h-4 w-4" /> Add Habit
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}
      
      {activeTab === "progress" && (
        <div>
          <h1 className="text-3xl font-bold mb-6">Progress</h1>
          <p>Progress charts will appear here.</p>
        </div>
      )}
      
      {activeTab === "social" && (
        <div>
          <h1 className="text-3xl font-bold mb-6">Social</h1>
          <p>Social features will appear here.</p>
        </div>
      )}
      
      {activeTab === "settings" && (
        <div>
          <h1 className="text-3xl font-bold mb-6">Settings</h1>
          <p>Settings will appear here.</p>
        </div>
      )}
    </div>
  );
}

