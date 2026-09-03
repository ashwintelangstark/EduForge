-- Complete Permissions, RLS, Primary Keys, and Indexes Fix for Supabase Project
-- Run this in Supabase SQL Editor to grant all permissions and ensure Healthy operational status

-- 1. Ensure user_profiles table has UUID default and no blocking constraints
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'faculty',
  assigned_subject TEXT NOT NULL DEFAULT 'All',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure id has default gen_random_uuid() even if table already existed
ALTER TABLE public.user_profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 2. Disable Row Level Security (RLS) on all public tables so no queries get 403
ALTER TABLE IF EXISTS public.subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chapters DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.question_options DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.question_banks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.question_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.symbols DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.science_libraries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.papers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.paper_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.app_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.test_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 3. Grant full schema, table, and sequence permissions
GRANT ALL ON SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role, postgres;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role, postgres;

-- 4. Create essential performance indexes on existing columns
CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON public.questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_chapter_id ON public.questions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_question_options_question_id ON public.question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_chapters_subject_id ON public.chapters(subject_id);
CREATE INDEX IF NOT EXISTS idx_papers_created_at ON public.papers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_paper_questions_paper_id ON public.paper_questions(paper_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- 5. Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
