-- Create spotify auth table
CREATE TABLE IF NOT EXISTS public.user_spotify_auth (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up RLS policies
ALTER TABLE public.user_spotify_auth ENABLE ROW LEVEL SECURITY;

-- Allow users to read only their own data
CREATE POLICY "Users can read their own Spotify data" 
  ON public.user_spotify_auth
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to update only their own data
CREATE POLICY "Users can update their own Spotify data" 
  ON public.user_spotify_auth
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow users to insert their own data
CREATE POLICY "Users can insert their own Spotify data" 
  ON public.user_spotify_auth
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own data
CREATE POLICY "Users can delete their own Spotify data" 
  ON public.user_spotify_auth
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_spotify_auth_user_id 
  ON public.user_spotify_auth(user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update timestamps
CREATE TRIGGER update_user_spotify_auth_updated_at
BEFORE UPDATE ON public.user_spotify_auth
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column(); 