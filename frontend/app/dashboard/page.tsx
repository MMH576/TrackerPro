'use client';

import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Add debug logging to help diagnose the issue
    console.log('Dashboard: Mounted', { isLoading: loading, hasUser: !!user });
    
    if (user) {
      console.log('Dashboard: User authenticated', user.email);
    } else if (!loading) {
      // If not loading and no user is present, redirect to login
      console.log('Dashboard: Not loading and no user, redirecting to login');
      router.push('/auth/login');
    }
  }, [loading, user, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect is handled in the auth context
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

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

  if (!user) {
    // This is a fallback - middleware should already handle this case
    console.log('Dashboard: No user found, redirecting to login');
    router.push('/auth/login');
    return null;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {user.user_metadata?.full_name || user.email}</h1>
          <p className="text-muted-foreground">Track your daily habits and build consistency</p>
        </div>
        <Button onClick={handleSignOut} variant="outline">
          Sign Out
        </Button>
      </div>
      
      <div className="grid gap-6">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Today's Habits</h2>
          <div className="text-muted-foreground">
            <p>You haven't created any habits yet.</p>
            <p className="mt-2">Get started by adding your first habit!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

