-- Create public schema
CREATE SCHEMA IF NOT EXISTS public;

-- Create profiles table (extension of auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users (id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create habits table
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles (id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  frequency JSONB NOT NULL, -- { type: 'daily' | 'weekly', days: [0,1,2,3,4,5,6] } or { type: 'monthly', days: [1,15] }
  target_count INTEGER DEFAULT 1 NOT NULL, -- e.g., 8 glasses of water
  remind_time TIME, -- time to send reminder
  is_archived BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create habit_logs table (completions)
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES public.habits (id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles (id) ON DELETE CASCADE NOT NULL,
  completed_date DATE NOT NULL,
  count INTEGER DEFAULT 1 NOT NULL, -- actual count completed
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (habit_id, completed_date) -- prevent duplicate entries for same habit/day
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles (id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('reminder', 'achievement', 'social', 'streak', 'system', 'friend')),
  related_id TEXT, -- ID of the related item (habit_id, challenge_id, etc)
  is_read BOOLEAN DEFAULT false NOT NULL,
  metadata JSONB, -- Additional data like name, avatar, etc
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Update realtime publication to include notifications
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
  public.profiles,
  public.habits,
  public.habit_logs,
  public.notifications;

-- Set up Row Level Security (RLS) policies

-- Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if you want to recreate them
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create policies
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Habits RLS
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if you want to recreate them
DROP POLICY IF EXISTS "Users can view their own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can create their own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can update their own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can delete their own habits" ON public.habits;

-- Create policies
CREATE POLICY "Users can view their own habits" 
  ON public.habits FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own habits" 
  ON public.habits FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits" 
  ON public.habits FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits" 
  ON public.habits FOR DELETE 
  USING (auth.uid() = user_id);

-- Habit Logs RLS
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if you want to recreate them
DROP POLICY IF EXISTS "Users can view their own habit logs" ON public.habit_logs;
DROP POLICY IF EXISTS "Users can create their own habit logs" ON public.habit_logs;
DROP POLICY IF EXISTS "Users can update their own habit logs" ON public.habit_logs;
DROP POLICY IF EXISTS "Users can delete their own habit logs" ON public.habit_logs;

-- Create policies
CREATE POLICY "Users can view their own habit logs" 
  ON public.habit_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own habit logs" 
  ON public.habit_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habit logs" 
  ON public.habit_logs FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habit logs" 
  ON public.habit_logs FOR DELETE 
  USING (auth.uid() = user_id);

-- Notifications RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if you want to recreate them
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

-- Create policies
CREATE POLICY "Users can view their own notifications" 
  ON public.notifications FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
  ON public.notifications FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" 
  ON public.notifications FOR DELETE 
  USING (auth.uid() = user_id);

-- Create trigger to create profile record when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user(); 