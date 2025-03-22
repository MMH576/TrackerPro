'use client';

import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type React from "react"
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { MainNav } from "@/components/main-nav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Manual authentication check as a failsafe
    if (!loading && !user) {
      console.log('DashboardLayout: No user found, redirecting to login');
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <h2 className="text-2xl font-bold">Loading</h2>
          <p className="text-muted-foreground">Please wait while we load your dashboard...</p>
        </div>
      </div>
    );
  }

  // Only render children if user is authenticated
  if (!user) return null;

  return (
    <div className="relative min-h-screen bg-background">
      <Header />
      <div className="container mx-auto flex max-w-6xl">
        <div className="hidden md:block">
          <MainNav />
        </div>
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
      <MobileNav className="md:hidden" />
    </div>
  )
}

