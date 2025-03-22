"use client"

import { BarChart, Home, Settings, User } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface MobileNavProps {
  className?: string
}

export function MobileNav({ className }: MobileNavProps) {
  const pathname = usePathname()
  
  // Don't show nav on auth pages
  if (pathname?.startsWith('/auth')) {
    return null
  }
  
  const items = [
    {
      id: "dashboard",
      label: "Habits",
      icon: Home,
      href: "/dashboard"
    },
    {
      id: "progress",
      label: "Progress",
      icon: BarChart,
      href: "/dashboard/progress"
    },
    {
      id: "profile",
      label: "Profile",
      icon: User,
      href: "/dashboard/profile"
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      href: "/dashboard/settings"
    },
  ]

  const getIsActive = (href: string) => {
    if (href === "/dashboard" && pathname === "/dashboard") {
      return true
    }
    return pathname.startsWith(href) && href !== "/dashboard"
  }

  return (
    <div className={cn("fixed bottom-0 left-0 right-0 border-t bg-background z-40", className)}>
      <div className="flex justify-around items-center h-16">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full transition-colors",
              getIsActive(item.href) ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

