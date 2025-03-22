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
};

// Create context
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signOut: async () => {},
});

// Auth Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);
  const router = useRouter();

  // Fetch current user data
  const fetchUser = async () => {
    try {
      console.log('AuthContext: Fetching user...');
      const { data, error } = await getCurrentUser();
      
      if (error) {
        // Handle "Auth session missing" error silently - this is normal when not logged in
        if (error.message?.includes('Auth session missing')) {
          console.log('AuthContext: No active session found - expected when not logged in');
          setUser(null);
        } else {
          // Log other errors as they might be actual issues
          console.error('AuthContext: Error fetching user', error);
          setError(error);
          setUser(null);
        }
      } else if (data?.user) {
        console.log('AuthContext: User found', data.user.email);
        setUser(data.user);
      } else {
        console.log('AuthContext: No user found');
        setUser(null);
      }
    } catch (err) {
      console.error('AuthContext: Error fetching user', err);
      setError(err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    console.log('AuthContext: Signing out...');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      console.log('AuthContext: Signed out successfully');
      setUser(null);
      // Redirect to login
      router.push('/auth/login');
    } catch (err) {
      console.error('AuthContext: Error signing out', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Listen for auth state changes and fetch user on mount
  useEffect(() => {
    console.log('AuthContext: Setting up auth state listener');
    
    // Initial user fetch
    fetchUser();
    
    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`AuthContext: Auth state changed - Event: ${event}`);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('AuthContext: User signed in, fetching user data');
        await fetchUser();
        // Redirect to dashboard
        router.push('/dashboard');
      } else if (event === 'SIGNED_OUT') {
        console.log('AuthContext: User signed out');
        setUser(null);
        router.push('/auth/login');
      } else if (event === 'USER_UPDATED') {
        console.log('AuthContext: User data updated, refreshing');
        await fetchUser();
      } else if (event === 'INITIAL_SESSION') {
        if (session) {
          console.log('AuthContext: Initial session with user, fetching data');
          await fetchUser();
          router.push('/dashboard');
        } else {
          console.log('AuthContext: Initial session without user - normal for unauthenticated users');
          setUser(null);
          setLoading(false);
        }
      }
    });
    
    // Cleanup
    return () => {
      authListener?.subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook for using auth
export function useAuth() {
  return useContext(AuthContext);
} 