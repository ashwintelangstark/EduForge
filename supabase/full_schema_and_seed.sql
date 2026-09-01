-- =============================================================================
-- EduForge Full Supabase PostgreSQL Schema & Seed Migration Script
-- Copy and paste this script into your Supabase Dashboard -> SQL Editor and click Run!
-- =============================================================================

-- 1. Create Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Chapters Table
CREATE TABLE IF NOT EXISTS chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    chapter_code TEXT,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Questions Table
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_code TEXT UNIQUE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
    question_type TEXT DEFAULT 'MCQ',
    content JSONB NOT NULL DEFAULT '[]'::jsonb,
    explanation JSONB,
    difficulty TEXT DEFAULT 'Medium',
    marks NUMERIC DEFAULT 1,
    negative_marks NUMERIC DEFAULT 0,
    correct_option TEXT,
    option_layout TEXT DEFAULT 'grid_2x2',
    year INTEGER,
    source TEXT,
    raw_text TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create Question Options Table
CREATE TABLE IF NOT EXISTS question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    option_key TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '[]'::jsonb,
    raw_text TEXT,
    sort_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create Tags & Question Tags
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS question_tags (
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, tag_id)
);

-- 6. Create Question Banks Table
CREATE TABLE IF NOT EXISTS question_banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Create Assets Table
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    filename TEXT,
    mime_type TEXT,
    size_bytes BIGINT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Create Templates Table
CREATE TABLE IF NOT EXISTS templates (
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
CREATE TABLE IF NOT EXISTS symbols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    symbol_character TEXT NOT NULL,
    latex_code TEXT NOT NULL,
    unicode_hex TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Create Science Libraries Table
CREATE TABLE IF NOT EXISTS science_libraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL, -- physics_chapters, chemistry_elements, chemistry_notations, units, constants
    name TEXT NOT NULL,
    symbol TEXT,
    value TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Create Papers Table
CREATE TABLE IF NOT EXISTS papers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
    settings JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    sections JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Create Paper Questions Table
CREATE TABLE IF NOT EXISTS paper_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID REFERENCES papers(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    section_id TEXT,
    sort_order INTEGER DEFAULT 1,
    custom_marks NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Create App Settings Table
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Create Search & Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON questions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_raw_text ON questions USING gin(to_tsvector('english', coalesce(raw_text, '')));

-- =============================================================================
-- Seed Data Insertion
-- =============================================================================

-- Insert Subjects
INSERT INTO subjects (id, name, code, color) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Physics', 'PHY', 'bg-sky-50 text-sky-700 border-sky-200'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Chemistry', 'CHE', 'bg-indigo-50 text-indigo-700 border-indigo-200'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Biology', 'BIO', 'bg-emerald-50 text-emerald-700 border-emerald-200'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Mathematics', 'MAT', 'bg-amber-50 text-amber-700 border-amber-200')
ON CONFLICT (code) DO NOTHING;

-- Insert Chapters
INSERT INTO chapters (id, subject_id, chapter_code, title) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PHY-MOT-0041', 'Kinematics & Motion'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PHY-ELE-0089', 'Electrostatics & Current'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'CHE-ATOM-0027', 'Atomic Structure & Bonding'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'CHE-ORG-0105', 'Organic Reaction Mechanisms'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b15', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'BIO-CELL-0012', 'Cell Structure & Function'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b16', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'BIO-GEN-0054', 'Genetics & Inheritance')
ON CONFLICT DO NOTHING;

-- Insert Sample Questions
INSERT INTO questions (id, question_code, subject_id, chapter_id, question_type, content, explanation, difficulty, marks, negative_marks, correct_option, option_layout, year, source, raw_text) VALUES
  (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11',
    'Q-PHY-001',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11',
    'MCQ',
    '[{"type":"text","html":"<p>A particle starts from rest with a uniform acceleration of 2 m/s². What is its velocity after 5 seconds?</p>"},{"type":"equation","latex":"v = u + at"}]'::jsonb,
    '[{"type":"text","html":"<p>Using v = u + at, where u = 0, a = 2 m/s², t = 5s: v = 0 + 2*5 = 10 m/s.</p>"}]'::jsonb,
    'Easy',
    1.0,
    0.25,
    'b',
    'grid_2x2',
    2024,
    'NEET Prep',
    'A particle starts from rest with a uniform acceleration of 2 m/s². What is its velocity after 5 seconds?'
  ),
  (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c12',
    'Q-PHY-002',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12',
    'MCQ',
    '[{"type":"text","html":"<p>What is the electric field intensity at a distance r from a point charge Q in vacuum?</p>"},{"type":"equation","latex":"E = \\frac{1}{4\\pi \\varepsilon_0} \\frac{Q}{r^2}"}]'::jsonb,
    '[{"type":"text","html":"<p>By Coulomb Law, electrostatic field intensity E is inverse-square proportional to r.</p>"}]'::jsonb,
    'Medium',
    2.0,
    0.5,
    'a',
    'grid_2x2',
    2023,
    'JEE Main',
    'What is the electric field intensity at a distance r from a point charge Q in vacuum?'
  )
ON CONFLICT (question_code) DO NOTHING;

-- Insert Question Options
INSERT INTO question_options (id, question_id, option_key, content, sort_order) VALUES
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'a', '[{"type":"text","html":"<p>5 m/s</p>"}]'::jsonb, 1),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'b', '[{"type":"text","html":"<p>10 m/s</p>"}]'::jsonb, 2),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'c', '[{"type":"text","html":"<p>15 m/s</p>"}]'::jsonb, 3),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'd', '[{"type":"text","html":"<p>20 m/s</p>"}]'::jsonb, 4),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d21', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c12', 'a', '[{"type":"equation","latex":"\\frac{1}{4\\pi \\varepsilon_0}\\frac{Q}{r^2}"}]'::jsonb, 1),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d22', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c12', 'b', '[{"type":"equation","latex":"\\frac{1}{4\\pi \\varepsilon_0}\\frac{Q}{r}"}]'::jsonb, 2),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d23', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c12', 'c', '[{"type":"equation","latex":"\\frac{1}{4\\pi \\varepsilon_0}\\frac{Q^2}{r^2}"}]'::jsonb, 3),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d24', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c12', 'd', '[{"type":"equation","latex":"\\frac{Q}{r^3}"}]'::jsonb, 4)
ON CONFLICT DO NOTHING;
