-- =============================================================================
-- EduForge Complete Supabase PostgreSQL Migration & Seed Script
-- Copy this entire file and paste it into your Supabase Dashboard:
-- Supabase Project -> SQL Editor -> Click 'New Query' -> Paste -> Click 'Run'
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT 'bg-sky-50 text-sky-700 border-sky-200',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Chapters Table
CREATE TABLE IF NOT EXISTS public.chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    chapter_code TEXT,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Questions Table
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_code TEXT UNIQUE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
    question_type TEXT DEFAULT 'MCQ',
    content JSONB NOT NULL DEFAULT '[]'::jsonb,
    explanation JSONB DEFAULT '[]'::jsonb,
    difficulty TEXT DEFAULT 'Medium',
    marks NUMERIC DEFAULT 4,
    negative_marks NUMERIC DEFAULT 1,
    correct_option TEXT DEFAULT 'a',
    option_layout TEXT DEFAULT 'grid_2x2',
    year INTEGER DEFAULT 2024,
    source TEXT DEFAULT 'NEET / JEE Bank',
    raw_text TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create Question Options Table
CREATE TABLE IF NOT EXISTS public.question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    option_key TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '[]'::jsonb,
    raw_text TEXT,
    sort_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create Tags and Question Tags
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.question_tags (
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, tag_id)
);

-- 6. Create Question Banks Table
CREATE TABLE IF NOT EXISTS public.question_banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Create Media Assets Table
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    filename TEXT,
    mime_type TEXT,
    size_bytes BIGINT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Create Templates Table
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    default_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    default_sections JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Create Symbols Table
CREATE TABLE IF NOT EXISTS public.symbols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    symbol_character TEXT NOT NULL,
    latex_code TEXT NOT NULL,
    unicode_hex TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Create Science Libraries Table
CREATE TABLE IF NOT EXISTS public.science_libraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    symbol TEXT,
    value TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Create Papers Table
CREATE TABLE IF NOT EXISTS public.papers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
    settings JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    sections JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Create Paper Questions Table
CREATE TABLE IF NOT EXISTS public.paper_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID REFERENCES public.papers(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    section_id TEXT,
    sort_order INTEGER DEFAULT 1,
    custom_marks NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Create Test Attempts Table
CREATE TABLE IF NOT EXISTS public.test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID REFERENCES public.papers(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_id TEXT,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    score NUMERIC DEFAULT 0,
    total_marks NUMERIC DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Create App Settings Table
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 15. Create User Profiles Table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'faculty',
    assigned_subject TEXT NOT NULL DEFAULT 'All',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Remove foreign key blocking constraint if table existed previously
ALTER TABLE IF EXISTS public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;
ALTER TABLE IF EXISTS public.user_profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- =============================================================================
-- Configure Permissions & Row Level Security (RLS)
-- =============================================================================
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symbols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.science_libraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Grant Open Access Policies so API and Frontend never hit RLS blockage
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public access on %I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Public access on %I" ON public.%I FOR ALL USING (true) WITH CHECK (true)', tbl, tbl);
  END LOOP;
END $$;

-- =============================================================================
-- Performance & Search Indexes
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_chapters_subject_id ON public.chapters(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON public.questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_chapter_id ON public.questions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_question_options_qid ON public.question_options(question_id);

-- =============================================================================
-- Standard Seed Data (Subjects, Chapters, Questions, Options, Profiles)
-- =============================================================================

-- Upsert Master Subjects
INSERT INTO public.subjects (id, name, code, color) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Physics', 'PHY', 'bg-sky-50 text-sky-700 border-sky-200'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Chemistry', 'CHE', 'bg-indigo-50 text-indigo-700 border-indigo-200'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Biology', 'BIO', 'bg-emerald-50 text-emerald-700 border-emerald-200'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Mathematics', 'MAT', 'bg-amber-50 text-amber-700 border-amber-200')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  color = EXCLUDED.color;

-- Upsert Standard Chapters
INSERT INTO public.chapters (id, subject_id, chapter_code, title) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PHY-01', 'Units and Measurements'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PHY-02', 'Kinematics & Motion in a Straight Line'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'CHE-01', 'Some Basic Concepts of Chemistry'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'CHE-02', 'Structure of Atom'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b15', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'BIO-01', 'The Living World'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b16', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'BIO-02', 'Biological Classification'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b17', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'MAT-01', 'Sets, Relations and Functions'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b18', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'MAT-02', 'Complex Numbers and Quadratic Equations')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  chapter_code = EXCLUDED.chapter_code,
  subject_id = EXCLUDED.subject_id;

-- Upsert Sample Questions Linked Directly to Subject and Chapter
INSERT INTO public.questions (id, question_code, subject_id, chapter_id, question_type, content, explanation, difficulty, marks, negative_marks, correct_option, option_layout, year, source, raw_text) VALUES
  (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11',
    'PHY-UNI-1001',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11',
    'MCQ',
    '[{"type":"text","html":"<p>Which of the following is NOT a fundamental SI unit?</p>"}]'::jsonb,
    '[{"type":"text","html":"<p>Newton is a derived unit (kg·m/s²), whereas Ampere, Candela, and Kelvin are base SI units.</p>"}]'::jsonb,
    'Easy',
    4.0,
    1.0,
    'c',
    'grid_2x2',
    2024,
    'NEET 2024',
    'Which of the following is NOT a fundamental SI unit?'
  ),
  (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c12',
    'CHE-ATO-2001',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14',
    'MCQ',
    '[{"type":"text","html":"<p>The total number of orbitals in a shell with principal quantum number n is:</p>"},{"type":"equation","latex":"N = n^2"}]'::jsonb,
    '[{"type":"text","html":"<p>Total number of orbitals associated with principal quantum number n is given by n².</p>"}]'::jsonb,
    'Medium',
    4.0,
    1.0,
    'b',
    'grid_2x2',
    2023,
    'JEE Main',
    'The total number of orbitals in a shell with principal quantum number n is:'
  ),
  (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c13',
    'BIO-LIV-3001',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b15',
    'MCQ',
    '[{"type":"text","html":"<p>Which taxonomic category contains organisms with the maximum number of similar characters?</p>"}]'::jsonb,
    '[{"type":"text","html":"<p>Species is the lowest and most specific taxonomic rank containing individuals with maximum shared characteristics.</p>"}]'::jsonb,
    'Easy',
    4.0,
    1.0,
    'a',
    'grid_2x2',
    2024,
    'NEET Prep',
    'Which taxonomic category contains organisms with the maximum number of similar characters?'
  )
ON CONFLICT (question_code) DO UPDATE SET
  subject_id = EXCLUDED.subject_id,
  chapter_id = EXCLUDED.chapter_id,
  raw_text = EXCLUDED.raw_text;

-- Upsert Question Options
INSERT INTO public.question_options (id, question_id, option_key, content, raw_text, sort_order) VALUES
  -- PHY-UNI-1001 Options
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'a', '[{"type":"text","html":"<p>Ampere</p>"}]'::jsonb, 'Ampere', 1),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'b', '[{"type":"text","html":"<p>Kelvin</p>"}]'::jsonb, 'Kelvin', 2),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'c', '[{"type":"text","html":"<p>Newton</p>"}]'::jsonb, 'Newton', 3),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'd', '[{"type":"text","html":"<p>Candela</p>"}]'::jsonb, 'Candela', 4),

  -- CHE-ATO-2001 Options
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d21', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c12', 'a', '[{"type":"equation","latex":"2n"}]'::jsonb, '2n', 1),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d22', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c12', 'b', '[{"type":"equation","latex":"n^2"}]'::jsonb, 'n^2', 2),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d23', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c12', 'c', '[{"type":"equation","latex":"2n^2"}]'::jsonb, '2n^2', 3),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d24', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c12', 'd', '[{"type":"equation","latex":"n"}]'::jsonb, 'n', 4),

  -- BIO-LIV-3001 Options
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d31', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c13', 'a', '[{"type":"text","html":"<p>Species</p>"}]'::jsonb, 'Species', 1),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d32', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c13', 'b', '[{"type":"text","html":"<p>Genus</p>"}]'::jsonb, 'Genus', 2),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d33', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c13', 'c', '[{"type":"text","html":"<p>Family</p>"}]'::jsonb, 'Family', 3),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d34', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c13', 'd', '[{"type":"text","html":"<p>Order</p>"}]'::jsonb, 'Order', 4)
ON CONFLICT (id) DO NOTHING;

-- Upsert Standard User Profiles
INSERT INTO public.user_profiles (id, email, name, role, assigned_subject) VALUES
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e11', 'admin@eduforge.com', 'System Admin', 'admin', 'All'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e12', 'physics@eduforge.com', 'Physics Faculty', 'faculty', 'Physics'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e13', 'chemistry@eduforge.com', 'Chemistry Faculty', 'faculty', 'Chemistry'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e14', 'biology@eduforge.com', 'Biology Faculty', 'faculty', 'Biology'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e15', 'maths@eduforge.com', 'Mathematics Faculty', 'faculty', 'Mathematics')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  assigned_subject = EXCLUDED.assigned_subject;
