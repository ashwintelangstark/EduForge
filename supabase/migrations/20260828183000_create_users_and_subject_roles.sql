-- Create user_profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'faculty',
  assigned_subject TEXT NOT NULL DEFAULT 'All',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow public read access to profiles for auth lookup
CREATE POLICY "Public read user_profiles" ON public.user_profiles
  FOR SELECT USING (true);

-- Allow service role full access
CREATE POLICY "Service role full access user_profiles" ON public.user_profiles
  USING (true) WITH CHECK (true);
