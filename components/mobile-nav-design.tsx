"use client"

import { Bell, Home, LineChart, Plus, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileNavDesignProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function MobileNavDesign({ activeTab, setActiveTab }: MobileNavDesignProps) {
  const navItems = [
    { id: "dashboard", label: "Home", icon: Home },
    { id: "progress", label: "Progress", icon: LineChart },
    { id: "add-habit", label: "Add", icon: Plus },
    { id: "social", label: "Social", icon: Users },
    { id: "notifications", label: "Alerts", icon: Bell },
  ]

  return (
    <div className="flex justify-around items-center p-2">
      {navItems.map((item) => (
        <button
          key={item.id}
          className={cn(
            "flex flex-col items-center justify-center p-2 rounded-lg",
            activeTab === item.id ? "text-primary" : "text-muted-foreground",
          )}
          onClick={() => setActiveTab(item.id)}
        >
          {item.id === "add-habit" ? (
            <div className="bg-primary text-primary-foreground p-2 rounded-full">
              <item.icon className="h-5 w-5" />
            </div>
          ) : (
            <item.icon className="h-5 w-5" />
          )}
          <span className="text-xs mt-1">{item.label}</span>
        </button>
      ))}
    </div>
  )
}

