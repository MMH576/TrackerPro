import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anonymous Key is missing!');
}

// DEV MODE: Set to false to ensure authentication is required
const ENABLE_DEV_MODE = true;

// Create client with persistent sessions
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'habittrack-auth-session',
    autoRefreshToken: true,
    // In production, use stricter settings
    flowType: process.env.NODE_ENV === 'production' ? 'pkce' : 'implicit'
  }
});

// Log environment setting for debugging
console.log(`Supabase client created in ${process.env.NODE_ENV} mode with flow type: ${process.env.NODE_ENV === 'production' ? 'pkce' : 'implicit'}`);

// Helper functions for authentication
export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
    },
  });
  
  return { data, error };
}

export async function signIn(email: string, password: string) {
  try {
    console.log('Supabase: Attempting sign in with email/password');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Supabase: Sign in error', error);
    } else if (data?.user) {
      console.log('Supabase: Sign in successful, user ID:', data.user.id);
    }
    
    return { data, error };
  } catch (err) {
    console.error('Supabase: Unexpected error during sign in', err);
    return { data: null, error: err };
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function signInWithGoogle() {
  // Get the app URL from env or fallback to localhost
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectTo = `${appUrl}/auth/callback`;
  
  console.log(`Google OAuth: Using redirect URL: ${redirectTo}`);
  console.log(`Google OAuth: Environment: ${process.env.NODE_ENV}`);
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    },
  });
  
  if (error) {
    console.error('Google OAuth Error:', error);
  } else {
    console.log('Google OAuth: Redirect initiated successfully');
  }
  
  return { data, error };
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  return { data, error };
}

export async function updateUserProfile(id: string, updates: any) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select();
  
  return { data, error };
} 