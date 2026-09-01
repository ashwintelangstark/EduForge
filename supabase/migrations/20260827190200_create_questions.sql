-- Migration: Create questions table
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

-- Index for lookup and filtering
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON questions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
