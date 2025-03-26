-- Create spotify tokens table
CREATE TABLE IF NOT EXISTS public.spotify_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up RLS policies
ALTER TABLE public.spotify_tokens ENABLE ROW LEVEL SECURITY;

-- Allow users to read only their own data
CREATE POLICY "Users can read their own Spotify data" 
  ON public.spotify_tokens
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to update only their own data
CREATE POLICY "Users can update their own Spotify data" 
  ON public.spotify_tokens
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow users to insert their own data
CREATE POLICY "Users can insert their own Spotify data" 
  ON public.spotify_tokens
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own data
CREATE POLICY "Users can delete their own Spotify data" 
  ON public.spotify_tokens
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_spotify_tokens_user_id 
  ON public.spotify_tokens(user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update timestamps
CREATE TRIGGER update_spotify_tokens_updated_at
BEFORE UPDATE ON public.spotify_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column(); 