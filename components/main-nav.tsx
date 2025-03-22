"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useUser } from "@/hooks/use-user"

interface MainNavProps {
  className?: string
}

export function MainNav({ className }: MainNavProps) {
  const pathname = usePathname()
  const { user } = useUser()

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      active: pathname === "/",
    },
    {
      name: "Progress",
      href: "/progress",
      active: pathname === "/progress",
    },
    {
      name: "Social",
      href: "/social",
      active: pathname === "/social",
    },
    {
      name: "Profile",
      href: "/profile",
      active: pathname === "/profile",
    },
  ]

  if (!user) {
    return null
  }

  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)}>
      {navItems.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            item.active ? "text-primary" : "text-muted-foreground",
          )}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  )
}

