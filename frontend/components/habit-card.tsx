'use client';

import { CheckCircle2, Star, Trash2, Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Habit } from "@/lib/types";
import { cn } from "@/lib/utils";

interface HabitCardProps {
  habit: Habit;
  onToggleCompletion: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export function HabitCard({ habit, onToggleCompletion, onDelete, onToggleFavorite }: HabitCardProps) {
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
        return "✨";
    }
  };

  const isCompletedToday = () => {
    const today = new Date().toISOString().split("T")[0];
    return habit.completedDates.includes(today);
  };

  return (
    <Card
      className={cn(
        isCompletedToday()
          ? "border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20"
          : ""
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">
              {getCategoryIcon(habit.category)}
            </span>
            <CardTitle className="text-lg">{habit.name}</CardTitle>
          </div>
          <div className="flex gap-1">
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
        <Button
          variant={isCompletedToday() ? "outline" : "default"}
          className="w-full gap-2"
          onClick={() => onToggleCompletion(habit.id)}
        >
          <CheckCircle2 className={cn("h-4 w-4", isCompletedToday() && "text-green-500")} />
          {isCompletedToday() ? "Completed Today" : "Mark as Complete"}
        </Button>
      </CardFooter>
    </Card>
  );
} 