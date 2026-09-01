-- Migration: Create test_attempts table for saving test attempt logs in Supabase
CREATE TABLE IF NOT EXISTS test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student TEXT NOT NULL,
    test TEXT NOT NULL,
    score TEXT NOT NULL DEFAULT '0 / 100',
    accuracy TEXT NOT NULL DEFAULT '0%',
    status TEXT NOT NULL DEFAULT 'Completed',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for ordering by creation time
CREATE INDEX IF NOT EXISTS idx_test_attempts_created_at ON test_attempts(created_at DESC);
