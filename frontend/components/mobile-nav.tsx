"use client"

import { BarChart, Home, Settings, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileNavProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function MobileNav({ activeTab, setActiveTab }: MobileNavProps) {
  const items = [
    {
      id: "habits",
      label: "Habits",
      icon: Home,
    },
    {
      id: "progress",
      label: "Progress",
      icon: BarChart,
    },
    {
      id: "social",
      label: "Social",
      icon: Users,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
    },
  ]

  return (
    <div className="flex justify-around items-center h-16">
      {items.map((item) => (
        <button
          key={item.id}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full transition-colors",
            activeTab === item.id ? "text-primary" : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setActiveTab(item.id)}
        >
          <item.icon className="h-5 w-5" />
          <span className="text-xs mt-1">{item.label}</span>
        </button>
      ))}
    </div>
  )
}

