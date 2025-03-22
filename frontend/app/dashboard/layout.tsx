'use client';

import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type React from "react"

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
      <div className="container mx-auto max-w-6xl">
        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  )
}

