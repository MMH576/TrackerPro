'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface HabitFiltersProps {
  className?: string;
  activeFilter: string;
  onChange: (value: string) => void;
}

export function HabitFilters({ className, activeFilter, onChange }: HabitFiltersProps) {
  return (
    <Tabs 
      defaultValue={activeFilter} 
      value={activeFilter} 
      onValueChange={onChange}
      className={cn("w-full", className)}
    >
      <TabsList className="w-full md:w-auto grid grid-cols-2 md:grid-cols-5 gap-1">
        <TabsTrigger value="all">All Habits</TabsTrigger>
        <TabsTrigger value="today">Today</TabsTrigger>
        <TabsTrigger value="favorites">Favorites</TabsTrigger>
        <TabsTrigger value="completed">Completed</TabsTrigger>
        <TabsTrigger value="categories">Categories</TabsTrigger>
      </TabsList>
    </Tabs>
  );
} 