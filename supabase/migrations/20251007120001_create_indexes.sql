-- migration: create performance indexes
-- purpose: optimize common query patterns for flashcards, study sessions, and ai generation batches
-- affected tables: flashcards, study_sessions, ai_generation_batches
-- special considerations: indexes chosen based on expected query patterns

-- ============================================================================
-- index: idx_flashcards_user_id
-- purpose: optimize flashcard listing, search, and count queries
-- rationale: most common query pattern is fetching a user's cards (fr-008 to fr-011)
-- query patterns supported:
--   - select * from flashcards where user_id = ?
--   - select count(*) from flashcards where user_id = ?
--   - select * from flashcards where user_id = ? order by created_at desc
-- ============================================================================

create index idx_flashcards_user_id on flashcards(user_id);

-- ============================================================================
-- index: idx_study_sessions_user_started
-- purpose: optimize streak calculation and recent activity queries
-- rationale: streak calculation requires fetching user's sessions ordered by date (fr-021)
-- query patterns supported:
--   - select * from study_sessions where user_id = ? and completed_at is not null order by started_at desc
--   - select * from study_sessions where user_id = ? and started_at >= ? order by started_at desc
-- notes: composite index on (user_id, started_at desc) is more efficient than separate indexes
-- ============================================================================

create index idx_study_sessions_user_started on study_sessions(user_id, started_at desc);

-- ============================================================================
-- index: idx_ai_generation_batches_user_id
-- purpose: optimize ai usage statistics and history retrieval
-- rationale: enables efficient querying of user's generation history and acceptance metrics
-- query patterns supported:
--   - select * from ai_generation_batches where user_id = ? order by generated_at desc
--   - select sum(cards_accepted), sum(total_cards_generated) from ai_generation_batches where user_id = ?
-- ============================================================================

create index idx_ai_generation_batches_user_id on ai_generation_batches(user_id);
