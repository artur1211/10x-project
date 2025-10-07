-- migration: create core tables for flashcard system
-- purpose: creates flashcards, study_sessions, and ai_generation_batches tables
-- affected tables: flashcards, study_sessions, ai_generation_batches
-- dependencies: requires supabase auth.users table
-- special considerations:
--   - all tables use cascade delete to maintain referential integrity
--   - varchar limits enforce business rules (front: 500, back: 1000 chars)
--   - check constraints ensure minimum content length (10 chars)
--   - generation_batch_id is nullable to support manual card creation

-- ============================================================================
-- table: ai_generation_batches
-- purpose: track ai-powered flashcard generation attempts and outcomes
-- created first due to foreign key dependency from flashcards table
-- ============================================================================

create table ai_generation_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  generated_at timestamptz not null default now(),
  input_text_length integer not null,
  total_cards_generated integer not null,
  cards_accepted integer not null,
  cards_rejected integer not null,
  cards_edited integer not null,
  time_taken_ms integer,
  model_used varchar(100)
);

-- ============================================================================
-- table: flashcards
-- purpose: stores user flashcard content (both ai-generated and manual)
-- constraints: front (10-500 chars), back (10-1000 chars)
-- notes: 500 card limit per user enforced at application level
-- ============================================================================

create table flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  generation_batch_id uuid references ai_generation_batches(id) on delete set null,
  front_text varchar(500) not null check (char_length(front_text) >= 10),
  back_text varchar(1000) not null check (char_length(back_text) >= 10),
  is_ai_generated boolean not null,
  was_edited boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- table: study_sessions
-- purpose: tracks user study sessions for streak calculation
-- notes: only completed sessions (completed_at not null) count toward streak
-- ============================================================================

create table study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  cards_studied integer not null default 0
);
