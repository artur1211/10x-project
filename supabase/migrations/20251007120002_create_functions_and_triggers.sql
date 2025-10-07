-- migration: create database functions and triggers
-- purpose: implement automatic timestamp updates for flashcards table
-- affected tables: flashcards
-- special considerations: trigger updates updated_at column before row update

-- ============================================================================
-- function: update_updated_at_column()
-- purpose: automatically update the updated_at timestamp when a row is modified
-- returns: trigger
-- notes:
--   - called by before update trigger
--   - sets new.updated_at to current timestamp
--   - ensures updated_at always reflects last modification time
-- ============================================================================

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================================
-- trigger: flashcards_updated_at
-- purpose: automatically update updated_at column when flashcard is modified
-- fires: before update on flashcards table
-- notes:
--   - ensures updated_at is always current
--   - prevents manual override of updated_at during updates
--   - critical for tracking when ai-generated cards are edited
-- ============================================================================

create trigger flashcards_updated_at
  before update on flashcards
  for each row
  execute function update_updated_at_column();
