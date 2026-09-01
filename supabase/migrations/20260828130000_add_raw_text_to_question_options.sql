-- Migration: Add raw_text column to question_options table for direct text access
ALTER TABLE question_options ADD COLUMN IF NOT EXISTS raw_text TEXT;

-- Index on question_id for fast joins
CREATE INDEX IF NOT EXISTS idx_question_options_qid ON question_options(question_id);
