'use client';

import { CheckCircle2, Clock, Hash, Star, Trash2, Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Habit } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { format } from "date-fns";

interface HabitCardProps {
  habit: Habit;
  onToggleCompletion: (id: string, value?: number) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export function HabitCard({ habit, onToggleCompletion, onDelete, onToggleFavorite }: HabitCardProps) {
  const [counterValue, setCounterValue] = useState<number>(1);
  const [timerValue, setTimerValue] = useState<number>(habit.goal || 5);
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "health":
        return "💪";
      case "learning":
        return "📚";
      case "productivity":
        return "⏱️";
      case "mindfulness":
        return "🧘";
      case "finance":
        return "💰";
      case "creativity":
        return "🎨";
      case "social":
        return "👥";
      default:
        return habit.icon || "✨";
    }
  };

  const isCompletedToday = () => {
    const today = new Date().toISOString().split("T")[0];
    return habit.completedDates.includes(today);
  };

  const getCompletionStatus = () => {
    if (!isCompletedToday()) return "incomplete";
    
    // For yes-no habits, completed is completed
    if (!habit.type || habit.type === "yes-no") return "complete";
    
    // For counter/timer habits, check if the goal was met
    const today = new Date().toISOString().split("T")[0];
    const todayLog = habit.logs?.find(log => log.date === today);
    
    if (!todayLog) return "incomplete";
    
    return todayLog.value >= habit.goal ? "complete" : "partial";
  };
  
  const completionStatus = getCompletionStatus();
  
  const handleToggleCompletion = () => {
    if (habit.type === "yes-no" || !habit.type) {
      onToggleCompletion(habit.id);
    } else if (habit.type === "counter") {
      onToggleCompletion(habit.id, counterValue);
    } else if (habit.type === "timer") {
      onToggleCompletion(habit.id, timerValue);
    }
  };
  
  const getHabitTypeIcon = () => {
    if (!habit.type || habit.type === "yes-no") {
      return <CheckCircle2 className="h-4 w-4" />;
    } else if (habit.type === "counter") {
      return <Hash className="h-4 w-4" />;
    } else if (habit.type === "timer") {
      return <Clock className="h-4 w-4" />;
    }
  };
  
  const getLastCompletedDate = () => {
    if (habit.completedDates.length === 0) return null;
    
    // Sort dates in descending order
    const sortedDates = [...habit.completedDates].sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
    
    return sortedDates[0];
  };
  
  const lastCompletedDate = getLastCompletedDate();

  return (
    <Card
      className={cn(
        completionStatus === "complete"
          ? "border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20"
          : completionStatus === "partial"
          ? "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20"
          : "",
        "h-full flex flex-col"
      )}
    >
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 min-w-0 max-w-[calc(100%-60px)]">
            <span className="text-xl flex-shrink-0" aria-hidden="true">
              {getCategoryIcon(habit.category)}
            </span>
            <CardTitle 
              className="text-lg truncate"
              title={habit.name}
            >
              {habit.name}
            </CardTitle>
          </div>
          <div className="flex gap-1 flex-shrink-0 ml-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-yellow-500"
              onClick={() => onToggleFavorite(habit.id)}
            >
              <Star
                className={cn(
                  "h-4 w-4",
                  habit.isFavorite && "fill-yellow-500 text-yellow-500"
                )}
              />
              <span className="sr-only">Favorite</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
              onClick={() => onDelete(habit.id)}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </div>
        {habit.description && <CardDescription className="line-clamp-2">{habit.description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          <div className="text-sm font-medium">
            {habit.streak > 0 ? `${habit.streak} day streak` : "Start your streak today!"}
          </div>
        </div>
        
        {lastCompletedDate && (
          <div className="text-xs text-muted-foreground mb-2">
            Last completed: {format(new Date(lastCompletedDate), "MMM d, yyyy")}
          </div>
        )}
        
        {habit.type === "counter" && !isCompletedToday() && (
          <div className="mt-4 flex items-center gap-2">
            <div className="text-sm font-medium">Count:</div>
            <Input
              type="number"
              min="1"
              max="100"
              value={counterValue}
              onChange={(e) => setCounterValue(Number(e.target.value))}
              className="w-20 h-8"
            />
            <div className="text-sm text-muted-foreground">/ {habit.goal}</div>
          </div>
        )}
        
        {habit.type === "timer" && !isCompletedToday() && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium">Duration:</div>
              <div className="text-sm font-medium">{timerValue} min</div>
            </div>
            <Slider
              value={[timerValue]}
              min={1}
              max={Math.max(60, habit.goal * 2)}
              step={1}
              onValueChange={(values) => setTimerValue(values[0])}
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-shrink-0 pt-0">
        <Button
          variant={isCompletedToday() ? "outline" : "default"}
          className="w-full"
          onClick={() => {
            if (habit.type === "yes-no") {
              onToggleCompletion(habit.id);
            } else if (habit.type === "counter") {
              onToggleCompletion(habit.id, counterValue);
            } else if (habit.type === "timer") {
              onToggleCompletion(habit.id, timerValue);
            }
          }}
        >
          {isCompletedToday() 
            ? "Completed" 
            : completionStatus === "partial" 
              ? "Complete"
              : "Mark as Complete"}
        </Button>
      </CardFooter>
    </Card>
  );
} 