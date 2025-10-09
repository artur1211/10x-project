-- migration: temporarily disable RLS for MVP testing
-- purpose: allow API testing without authentication setup
-- affected tables: flashcards, study_sessions, ai_generation_batches
-- WARNING: This is for development/testing only. Re-enable RLS before production!

-- Disable RLS on ai_generation_batches table
alter table ai_generation_batches disable row level security;

-- Disable RLS on flashcards table
alter table flashcards disable row level security;

-- Disable RLS on study_sessions table
alter table study_sessions disable row level security;