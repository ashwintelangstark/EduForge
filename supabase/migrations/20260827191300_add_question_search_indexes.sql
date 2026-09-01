-- Migration: Add search indexes for questions
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(question_type);
CREATE INDEX IF NOT EXISTS idx_questions_year ON questions(year);
CREATE INDEX IF NOT EXISTS idx_questions_source ON questions(source);

-- Full text search index on raw_text
CREATE INDEX IF NOT EXISTS idx_questions_raw_text_trgm ON questions USING gin (to_tsvector('english', coalesce(raw_text, '')));
