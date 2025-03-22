'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface MainTabsProps {
  className?: string;
  activeTab: string;
  onChange: (value: string) => void;
}

export function MainTabs({ className, activeTab, onChange }: MainTabsProps) {
  return (
    <div className={cn("flex justify-center", className)}>
      <Tabs 
        defaultValue={activeTab} 
        value={activeTab} 
        onValueChange={onChange}
        className="w-full max-w-xl"
      >
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="habits">Habits</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
} 