'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";

interface MainTabsProps {
  defaultValue?: string;
  className?: string;
  children: React.ReactNode;
}

export function MainTabs({ defaultValue = "today", className, children }: MainTabsProps) {
  return (
    <Tabs defaultValue={defaultValue} className={cn("space-y-4", className)}>
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="today" className="flex items-center gap-2">
          <ListTodo className="h-4 w-4" />
          Today
        </TabsTrigger>
        <TabsTrigger value="week" className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          Week View
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
} 