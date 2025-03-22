'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter, Star } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";

interface HabitFiltersProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function HabitFilters({ selectedCategory, onCategoryChange }: HabitFiltersProps) {
  const categories = [
    { id: "all", name: "All Habits", icon: "✨" },
    { id: "today", name: "Today", icon: "📅" },
    { id: "favorites", name: "Favorites", icon: "⭐" },
    { id: "completed", name: "Completed", icon: "✅" },
    { id: "categories", name: "Categories", icon: "📂" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-card border rounded-lg p-4 overflow-hidden">
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <Button
                variant={selectedCategory === category.id ? "default" : "outline"}
                className="flex-shrink-0 px-4 py-2 h-auto transition-all"
                onClick={() => onCategoryChange(category.id)}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
                {category.id === "favorites" && <Star className="ml-2 h-4 w-4" />}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
} 