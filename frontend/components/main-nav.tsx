"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { BarChart, Home, Settings, User, Plus } from "lucide-react"

interface MainNavProps {
  className?: string
}

export function MainNav({ className }: MainNavProps) {
  const pathname = usePathname()
  const { user } = useAuth()

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      name: "Add Habit",
      href: "/dashboard/add-habit",
      icon: Plus,
    },
    {
      name: "Progress",
      href: "/dashboard/progress",
      icon: BarChart,
    },
    {
      name: "Profile",
      href: "/dashboard/profile",
      icon: User,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ]

  const isActive = (path: string) => {
    if (path === "/dashboard" && pathname === "/dashboard") {
      return true
    }
    return pathname.startsWith(path) && path !== "/dashboard";
  }

  // If no user or on auth pages, don't render anything
  if (!user || pathname?.startsWith('/auth')) {
    return null
  }

  return (
    <nav className={cn("py-6 pr-6 w-56", className)}>
      <div className="space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isActive(item.href) 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        ))}
      </div>
    </nav>
  )
}

