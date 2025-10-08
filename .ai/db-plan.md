# Database Schema - 10x-project

## Overview

This database schema supports an AI-powered flashcard generation platform with spaced repetition learning. The MVP focuses on core functionality including user authentication, flashcard management, AI generation tracking, and study session monitoring with streak calculation.

## Tables

### 1. flashcards

Core entity storing user flashcard content. Supports both AI-generated and manually created cards.

| Column              | Type          | Constraints                                                   | Description                                              |
| ------------------- | ------------- | ------------------------------------------------------------- | -------------------------------------------------------- |
| id                  | uuid          | PRIMARY KEY, DEFAULT gen_random_uuid()                        | Flashcard unique identifier                              |
| user_id             | uuid          | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE         | Owner of the flashcard                                   |
| generation_batch_id | uuid          | NULL, REFERENCES ai_generation_batches(id) ON DELETE SET NULL | Optional link to AI generation batch                     |
| front_text          | varchar(500)  | NOT NULL, CHECK (char_length(front_text) >= 10)               | Front side content (FR-005)                              |
| back_text           | varchar(1000) | NOT NULL, CHECK (char_length(back_text) >= 10)                | Back side content (FR-006)                               |
| is_ai_generated     | boolean       | NOT NULL                                                      | Indicates if card was AI-generated                       |
| was_edited          | boolean       | NOT NULL                                                      | Indicates if card was modified after generation/creation |
| created_at          | timestamptz   | NOT NULL, DEFAULT NOW()                                       | Creation timestamp                                       |
| updated_at          | timestamptz   | NOT NULL, DEFAULT NOW()                                       | Last update timestamp                                    |

**Table Comment:** Stores flashcard content with 10-500 character front and 10-1000 character back limits (FR-005, FR-006). Maximum 500 cards per user enforced at application level (FR-011).

**Column Comments:**

- `generation_batch_id`: Links AI-generated cards to their batch for tracking acceptance metrics
- `was_edited`: Tracks if AI-generated card was modified during review or if any card was edited post-creation

### 2. study_sessions

Tracks user study sessions for streak calculation and activity monitoring.

| Column        | Type        | Constraints                                           | Description                                      |
| ------------- | ----------- | ----------------------------------------------------- | ------------------------------------------------ |
| id            | uuid        | PRIMARY KEY, DEFAULT gen_random_uuid()                | Session unique identifier                        |
| user_id       | uuid        | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | User who conducted the session                   |
| started_at    | timestamptz | NOT NULL, DEFAULT NOW()                               | Session start timestamp                          |
| completed_at  | timestamptz | NULL                                                  | Session completion timestamp (NULL = incomplete) |
| cards_studied | integer     | NOT NULL, DEFAULT 0                                   | Number of cards reviewed in session              |

**Table Comment:** Records study sessions for streak tracking (FR-021). Completed sessions are used to calculate streaks on-demand via application logic.

**Column Comments:**

- `completed_at`: NULL indicates incomplete/abandoned session. Only completed sessions count toward streak.

### 3. ai_generation_batches

Tracks AI-powered flashcard generation attempts and their outcomes for metrics analysis.

| Column                | Type         | Constraints                                           | Description                                       |
| --------------------- | ------------ | ----------------------------------------------------- | ------------------------------------------------- |
| id                    | uuid         | PRIMARY KEY, DEFAULT gen_random_uuid()                | Batch unique identifier                           |
| user_id               | uuid         | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | User who requested generation                     |
| generated_at          | timestamptz  | NOT NULL, DEFAULT NOW()                               | Generation timestamp                              |
| input_text_length     | integer      | NOT NULL                                              | Character count of input text                     |
| total_cards_generated | integer      | NOT NULL                                              | Total cards generated by AI                       |
| cards_accepted        | integer      | NOT NULL                                              | Number of cards accepted by user                  |
| cards_rejected        | integer      | NOT NULL                                              | Number of cards rejected by user                  |
| cards_edited          | integer      | NOT NULL                                              | Number of cards edited before acceptance          |
| time_taken_ms         | integer      | NULL                                                  | Generation time in milliseconds                   |
| model_used            | varchar(100) | NULL                                                  | AI model identifier (e.g., OpenRouter model name) |

**Table Comment:** Tracks AI generation statistics to measure 75% acceptance rate target (Success Metrics). Only accepted cards are stored in flashcards table.

**Column Comments:**

- `cards_accepted + cards_rejected = total_cards_generated`
- `time_taken_ms`: Null if not recorded
- `model_used`: OpenRouter.ai model identifier for cost and performance tracking

## Relationships

### Entity Relationship Diagram

```
auth.users (Supabase Auth)
    │
    ├──[1:N]──> flashcards (CASCADE DELETE)
    │               │
    │               └──[N:1]── ai_generation_batches
    │
    ├──[1:N]──> study_sessions (CASCADE DELETE)
    │
    └──[1:N]──> ai_generation_batches (CASCADE DELETE)
```

### Relationship Details

1. **auth.users → flashcards** (1:N)
   - One user can have many flashcards (up to 500, enforced at application level)
   - CASCADE DELETE: All flashcards deleted when user account is deleted

2. **auth.users → study_sessions** (1:N)
   - One user can have many study sessions
   - CASCADE DELETE: All sessions deleted when user account is deleted

3. **auth.users → ai_generation_batches** (1:N)
   - One user can have many AI generation attempts
   - CASCADE DELETE: All generation records deleted when user account is deleted

4. **ai_generation_batches → flashcards** (1:N, optional)
   - One generation batch can produce many flashcards
   - Optional relationship: manually created cards have NULL generation_batch_id
   - ON DELETE SET NULL: If batch is deleted, flashcards remain but lose generation tracking

## Indexes

```sql
-- Flashcards: Most common query pattern is fetching user's cards
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);

-- Study Sessions: Frequently queried for streak calculation and recent activity
CREATE INDEX idx_study_sessions_user_started ON study_sessions(user_id, started_at DESC);

-- AI Generation Batches: Queried for user's generation history and statistics
CREATE INDEX idx_ai_generation_batches_user_id ON ai_generation_batches(user_id);
```

### Index Justification

- `idx_flashcards_user_id`: Supports flashcard listing, search, and count queries (FR-008 to FR-011)
- `idx_study_sessions_user_started`: Optimizes streak calculation and recent session queries (FR-021)
- `idx_ai_generation_batches_user_id`: Enables efficient AI usage statistics and history retrieval

## PostgreSQL Policies (Row-Level Security)

All tables implement RLS with separate policies for each operation to ensure users can only access their own data.

### flashcards

```sql
-- Enable RLS
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can read their own flashcards
CREATE POLICY flashcards_select ON flashcards
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can create their own flashcards
CREATE POLICY flashcards_insert ON flashcards
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own flashcards
CREATE POLICY flashcards_update ON flashcards
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own flashcards
CREATE POLICY flashcards_delete ON flashcards
  FOR DELETE
  USING (auth.uid() = user_id);
```

### study_sessions

```sql
-- Enable RLS
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can read their own study sessions
CREATE POLICY study_sessions_select ON study_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can create their own study sessions
CREATE POLICY study_sessions_insert ON study_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own study sessions
CREATE POLICY study_sessions_update ON study_sessions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own study sessions
CREATE POLICY study_sessions_delete ON study_sessions
  FOR DELETE
  USING (auth.uid() = user_id);
```

### ai_generation_batches

```sql
-- Enable RLS
ALTER TABLE ai_generation_batches ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can read their own generation batches
CREATE POLICY ai_generation_batches_select ON ai_generation_batches
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can create their own generation batches
CREATE POLICY ai_generation_batches_insert ON ai_generation_batches
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own generation batches
CREATE POLICY ai_generation_batches_update ON ai_generation_batches
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own generation batches
CREATE POLICY ai_generation_batches_delete ON ai_generation_batches
  FOR DELETE
  USING (auth.uid() = user_id);
```

## Database Functions and Triggers

### Automatic Timestamp Updates

Updates the `updated_at` column automatically on row modifications.

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to flashcards
CREATE TRIGGER flashcards_updated_at
  BEFORE UPDATE ON flashcards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Additional Notes

### Design Decisions

1. **MVP Scope Limitations:**
   - No user_profiles table (streak calculation done on-demand from study_sessions)
   - No spaced repetition algorithm fields in database (deferred to post-MVP)
   - No AI budget tracking in database (handled at application level)
   - No historical card review tracking (only current state stored)
   - 500 flashcard limit enforced at application level, not database level

2. **Validation Strategy:**
   - Database-level: VARCHAR limits (500/1000) + CHECK constraints for minimum length (10)
   - Application-level: Client and server-side validation for better UX
   - Defense in depth: Both levels provide redundant protection

3. **Deletion Strategy:**
   - Hard delete via CASCADE DELETE (no soft delete for MVP)
   - Complete data removal within 24 hours per FR-016
   - Simplifies storage and reduces complexity

4. **Search Implementation:**
   - MVP uses simple ILIKE pattern matching: `WHERE front_text ILIKE '%query%' OR back_text ILIKE '%query%'`
   - Can upgrade to PostgreSQL full-text search post-MVP if needed
   - No dedicated search indexes for MVP

5. **AI Generation Tracking:**
   - Only accepted cards stored in flashcards table
   - Rejected cards tracked via aggregate statistics in ai_generation_batches
   - Reduces storage overhead while maintaining success metrics (75% acceptance rate target)

6. **Streak Calculation:**
   - Calculated on-demand from study_sessions table (no cached values for MVP)
   - Query uses completed_at timestamps to identify consecutive study days
   - Can add user_profiles table with precalculated streaks post-MVP if needed
   - Requires clarification on timezone handling and minimum session requirements
   - Only completed sessions (completed_at NOT NULL) should count toward streak

### Migration Strategy

- Use Supabase CLI for migration management
- Create separate migration files in `supabase/migrations/` directory
- Suggested migration file structure:
  1. `01_create_tables.sql` - Create all tables (flashcards, study_sessions, ai_generation_batches)
  2. `02_create_indexes.sql` - Create indexes
  3. `03_create_functions.sql` - Create trigger functions
  4. `04_create_triggers.sql` - Create triggers
  5. `05_enable_rls.sql` - Enable RLS and create policies
  6. `06_add_comments.sql` - Add table and column comments

### Unresolved Implementation Details

The following require clarification during implementation:

1. **Streak Calculation Logic:**
   - Timezone for determining "today" for streak counting
   - Minimum session length/cards studied to count toward streak
   - Grace period for missed days (currently: no grace period)

2. **Boolean Field Defaults:**
   - `is_ai_generated`: Application must explicitly set (true for AI, false for manual)
   - `was_edited`: Application must explicitly set (true if edited during review, false otherwise)

3. **Study Session Completion:**
   - Define criteria for marking session as complete
   - Impact of incomplete sessions on streak calculation

4. **AI Generation Batch Completion:**
   - Handle partial acceptance scenarios (user closes browser during review)
   - Consider adding batch completion status if needed post-MVP

### Future Enhancements

Post-MVP considerations that don't require schema changes now:

1. **User Profiles Table:** Add user_profiles with precalculated current_streak, longest_streak, last_study_date
2. **Spaced Repetition:** Add columns to flashcards (ease_factor, interval, next_review_date)
3. **Full-Text Search:** Add tsvector column and GIN index to flashcards
4. **Soft Delete:** Add deleted_at column to support undo/recovery
5. **Card Review History:** Create card_reviews table for historical tracking
6. **Pre-Aggregated Statistics:** Create user_statistics table for performance
7. **AI Budget Tracking:** Add ai_usage_tracking table if needed

### Performance Considerations

- Expected user base: Small to medium (MVP scale)
- Expected flashcards per user: Average 100-200, maximum 500
- Query patterns optimized via indexes on user_id and temporal columns
- Pagination recommended for flashcard listings (20 per page per FR-011)
- Aggregate statistics calculated on-demand for MVP (can pre-aggregate later)
- Streak calculation done on-demand (acceptable performance at MVP scale, can cache later)

### Security Notes

- All tables protected by RLS policies
- Users cannot access other users' data
- Authentication handled by Supabase (session timeout: 30 days per FR-017)
- No public access to any tables without authentication
