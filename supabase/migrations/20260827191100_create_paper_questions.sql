-- Migration: Create paper_questions table
CREATE TABLE IF NOT EXISTS paper_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
    position INTEGER DEFAULT 0,
    section TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for paper questions lookup
CREATE INDEX IF NOT EXISTS idx_paper_questions_paper_id ON paper_questions(paper_id);
