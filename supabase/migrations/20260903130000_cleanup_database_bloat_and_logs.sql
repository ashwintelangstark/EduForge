-- ====================================================================
-- Safe Supabase Database Log & Egress Bloat Cleanup Migration
-- ====================================================================
-- This script does NOT delete any questions, options, answers, images,
-- bucket files, users, or application data.
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query).
-- ====================================================================

-- 1. Clear system Realtime message logs (system table that inflates WAL & PostgREST egress)
TRUNCATE TABLE IF EXISTS realtime.messages;

-- 2. Reset system statement statistics log table
SELECT pg_stat_statements_reset();

-- 3. Clean legacy inline Base64 image bloat from existing question statement text
--    (Removes heavy data:image base64 strings from raw_text while leaving all question text intact)
UPDATE public.questions
SET raw_text = REGEXP_REPLACE(raw_text, '<img[^>]*src="data:image\/[^;]+;base64,[^"]+"[^>]*>', '', 'gi')
WHERE raw_text LIKE '%data:image/%';

-- 4. Clean legacy inline Base64 image bloat from existing option text
UPDATE public.question_options
SET raw_text = REGEXP_REPLACE(raw_text, '<img[^>]*src="data:image\/[^;]+;base64,[^"]+"[^>]*>', '', 'gi')
WHERE raw_text LIKE '%data:image/%';

-- 5. Reclaim disk space and compact database tables
VACUUM (ANALYZE) public.questions;
VACUUM (ANALYZE) public.question_options;
VACUUM (ANALYZE) public.assets;
VACUUM (ANALYZE) public.papers;
VACUUM (ANALYZE) public.user_profiles;

-- 6. Reload PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';
