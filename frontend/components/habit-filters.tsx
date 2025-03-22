'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter, Star } from "lucide-react";

interface HabitFiltersProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function HabitFilters({ selectedCategory, onCategoryChange }: HabitFiltersProps) {
  const categories = [
    { id: "all", name: "All Habits", icon: "✨" },
    { id: "favorites", name: "Favorites", icon: "⭐" },
    { id: "health", name: "Health & Fitness", icon: "💪" },
    { id: "mindfulness", name: "Mindfulness", icon: "🧘" },
    { id: "productivity", name: "Productivity", icon: "⏱️" },
    { id: "learning", name: "Learning", icon: "📚" },
    { id: "finance", name: "Finance", icon: "💰" },
    { id: "creativity", name: "Creativity", icon: "🎨" },
    { id: "social", name: "Social", icon: "👥" }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Categories
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 overflow-auto max-h-[280px] pr-1">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "ghost"}
            className="w-full justify-start font-normal"
            onClick={() => onCategoryChange(category.id)}
          >
            <span className="mr-2">{category.icon}</span>
            {category.name}
            {category.id === "favorites" && <Star className="ml-auto h-4 w-4" />}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
} 