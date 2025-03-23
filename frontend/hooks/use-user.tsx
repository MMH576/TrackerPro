"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';

// User type definition
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  createdAt: string;
  settings: {
    darkMode: boolean;
    notifications: boolean;
    calendarSync: boolean;
    weekStartsOn: number;
    compactView: boolean;
    animations: boolean;
    streakAlerts: boolean;
    achievementAlerts: boolean;
    friendAlerts: boolean;
    defaultReminderTime: string;
    defaultCategory: string;
    publicProfile: boolean;
    shareProgress: boolean;
    analytics: boolean;
  };
}

// Default mock user data
const defaultUser: User = {
  id: 'user1',
  name: 'Test User',
  email: 'demo@example.com',
  avatar: '/placeholder.svg?height=40&width=40',
  role: 'user',
  createdAt: new Date().toISOString(),
  settings: {
    darkMode: true,
    notifications: true,
    calendarSync: false,
    weekStartsOn: 0, // Sunday
    compactView: false,
    animations: true,
    streakAlerts: true,
    achievementAlerts: true,
    friendAlerts: true,
    defaultReminderTime: "09:00",
    defaultCategory: "health",
    publicProfile: false,
    shareProgress: true,
    analytics: true
  },
};

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error: Error | null }>;
  logout: () => Promise<{ success: boolean; error: Error | null }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error: Error | null }>;
}

// Create context
const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
  error: null,
  isAuthenticated: false,
  login: async () => ({ success: false, error: new Error('Not implemented') }),
  logout: async () => ({ success: false, error: new Error('Not implemented') }),
  signup: async () => ({ success: false, error: new Error('Not implemented') })
});

// Provider component
export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Check if the user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        // In a real app, we would check for a token in localStorage and validate it with the API
        // const token = localStorage.getItem('auth_token')
        // if (token) {
        //   const response = await fetch('/api/auth/me', {
        //     headers: { Authorization: `Bearer ${token}` }
        //   })
        //   if (response.ok) {
        //     const userData = await response.json()
        //     setUser(userData)
        //   } else {
        //     localStorage.removeItem('auth_token')
        //     setUser(null)
        //   }
        // }
        
        // For development, use mock user
        if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 500));
          setUser(defaultUser);
        } else {
          setUser(null);
        }
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Authentication check failed'));
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // In a real app, we would call the API to authenticate
      // const response = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password })
      // })
      
      // if (response.ok) {
      //   const data = await response.json()
      //   localStorage.setItem('auth_token', data.token)
      //   setUser(data.user)
      //   return { success: true, error: null }
      // } else {
      //   const errorData = await response.json()
      //   throw new Error(errorData.message || 'Login failed')
      // }
      
      // For development, simulate login with mock user
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (email === 'demo@example.com' && password === 'password') {
        setUser(defaultUser);
        return { success: true, error: null };
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Login failed'));
      return { 
        success: false, 
        error: err instanceof Error ? err : new Error('Login failed') 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // In a real app, we would call the API to logout
      // const response = await fetch('/api/auth/logout', {
      //   method: 'POST'
      // })
      
      // if (response.ok) {
      //   localStorage.removeItem('auth_token')
      //   setUser(null)
      // } else {
      //   const errorData = await response.json()
      //   throw new Error(errorData.message || 'Logout failed')
      // }
      
      // For development, simulate logout
      await new Promise(resolve => setTimeout(resolve, 500));
      setUser(null);
      
      return { success: true, error: null };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Logout failed'));
      return { 
        success: false, 
        error: err instanceof Error ? err : new Error('Logout failed') 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Signup function
  const signup = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // In a real app, we would call the API to sign up
      // const response = await fetch('/api/auth/signup', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ name, email, password })
      // })
      
      // if (response.ok) {
      //   const data = await response.json()
      //   localStorage.setItem('auth_token', data.token)
      //   setUser(data.user)
      //   return { success: true, error: null }
      // } else {
      //   const errorData = await response.json()
      //   throw new Error(errorData.message || 'Signup failed')
      // }
      
      // For development, simulate signup with mock user
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newUser: User = {
        ...defaultUser,
        name,
        email,
        id: `user_${Date.now()}`,
      };
      
      setUser(newUser);
      return { success: true, error: null };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Signup failed'));
      return { 
        success: false, 
        error: err instanceof Error ? err : new Error('Signup failed') 
      };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      isLoading, 
      error, 
      isAuthenticated: !!user,
      login,
      logout,
      signup
    }}>
      {children}
    </UserContext.Provider>
  );
}

// Hook to use the auth context
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

