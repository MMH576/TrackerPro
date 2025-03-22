'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, getCurrentUser } from './supabase';

// Context type
type AuthContextType = {
  user: any | null;
  loading: boolean;
  error: any | null;
  signOut: () => Promise<void>;
  isDevelopmentMode: boolean;
};

// Create context
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signOut: async () => {},
  isDevelopmentMode: false
});

// Development mode settings
const ENABLE_DEV_AUTH_BYPASS = process.env.NODE_ENV !== 'production';
const DEV_USER = ENABLE_DEV_AUTH_BYPASS ? {
  id: 'dev-user-123',
  email: 'dev@example.com',
  user_metadata: {
    full_name: 'Development User',
  }
} : null;

// Auth Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);
  const router = useRouter();
  const isDevelopmentMode = process.env.NODE_ENV !== 'production';

  // Fetch current user data
  const fetchUser = async () => {
    try {
      console.log('AuthContext: Fetching user...');
      const { data, error } = await getCurrentUser();
      
      if (error) {
        // Handle "Auth session missing" error silently - this is normal when not logged in
        if (error.message?.includes('Auth session missing')) {
          console.log('AuthContext: No active session found - expected when not logged in');
          
          // Use development mock user if enabled
          if (ENABLE_DEV_AUTH_BYPASS) {
            console.log('AuthContext: Using development mock user');
            setUser(DEV_USER);
          } else {
            setUser(null);
          }
        } else {
          // Log other errors as they might be actual issues
          console.error('AuthContext: Error fetching user', error);
          setError(error);
          
          // Use development mock user if enabled
          if (ENABLE_DEV_AUTH_BYPASS) {
            console.log('AuthContext: Using development mock user despite error');
            setUser(DEV_USER);
          } else {
            setUser(null);
          }
        }
      } else if (data?.user) {
        console.log('AuthContext: User found', data.user.email);
        setUser(data.user);
      } else {
        console.log('AuthContext: No user found');
        // Use development mock user if enabled
        if (ENABLE_DEV_AUTH_BYPASS) {
          console.log('AuthContext: Using development mock user as fallback');
          setUser(DEV_USER);
        } else {
          setUser(null);
        }
      }
    } catch (err) {
      console.error('AuthContext: Unexpected error fetching user', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch user'));
      
      // Use development mock user if enabled
      if (ENABLE_DEV_AUTH_BYPASS) {
        console.log('AuthContext: Using development mock user after error');
        setUser(DEV_USER);
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Sign out the user
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('AuthContext: Sign out error', error);
        setError(error);
      } else {
        console.log('AuthContext: Signed out successfully');
        setUser(null);
        // Redirect to home page after sign out
        router.push('/auth/login');
      }
    } catch (err) {
      console.error('AuthContext: Unexpected error during sign out', err);
      setError(err instanceof Error ? err : new Error('Failed to sign out'));
    }
  };

  // Auth state change listener and session refresh
  useEffect(() => {
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state changed', event);
        
        if (event === 'SIGNED_IN' && session) {
          console.log('AuthContext: User signed in', session.user.id);
          setUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          console.log('AuthContext: User signed out');
          
          // Use development mock user if enabled
          if (ENABLE_DEV_AUTH_BYPASS) {
            console.log('AuthContext: Using development mock user after sign out');
            setUser(DEV_USER);
          } else {
            setUser(null);
          }
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('AuthContext: Token refreshed');
          // Re-fetch user to get latest data
          fetchUser();
        }
      }
    );

    // Initial fetch
    fetchUser();

    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, error, signOut: handleSignOut, isDevelopmentMode }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext); 