# Product Requirements Document (PRD) - 10x-project

## 1. Product Overview

### 1.1 Product Vision

An AI-powered flashcard generation system that streamlines the creation of high-quality study materials, enabling learners to leverage spaced repetition learning methodology without the time-consuming manual creation process.

### 1.2 Target Audience

- Primary: Students at all educational levels who need to memorize large amounts of information
- Secondary: Professional learners preparing for certifications or skill development
- Tertiary: Language learners and hobbyists seeking efficient memorization tools

### 1.3 Core Value Proposition

Reduce flashcard creation time by 75% through AI-powered generation while maintaining high quality standards, enabling users to focus on learning rather than content preparation.

### 1.4 Technical Architecture

- Platform: Web-only application supporting major browsers (Chrome, Firefox, Safari, Edge)
- Authentication: Supabase authentication system
- Database: Supabase for data storage
- AI Integration: OpenRouter.ai with cost-efficient models (Claude Haiku/GPT-3.5-turbo)
- Learning Algorithm: Open-source spaced repetition implementation

## 2. User Problem

### 2.1 Primary Problem Statement

Manual creation of educational flashcards is time-consuming and tedious, creating a significant barrier to adopting spaced repetition learning despite its proven effectiveness. Users spend big portion of their study preparation time creating flashcards rather than actually learning the material.

### 2.2 Current Pain Points

- Time Investment: Creating quality flashcards manually takes a lot of time
- Quality Inconsistency: Manual creation leads to varying card quality and effectiveness
- Motivation Barrier: The effort required for card creation discourages consistent study habits
- Format Limitations: Difficulty in extracting key concepts from unstructured text materials

### 2.3 Desired Outcome

Users should be able to transform any educational text into ready-to-study flashcards within minutes, maintaining 75% acceptance rate for AI-generated content while preserving the option for manual refinement and creation.

## 3. Functional Requirements

### 3.1 AI-Powered Flashcard Generation

- FR-001: System shall accept text input between 1,000-10,000 characters via copy-paste
- FR-002: System shall generate 5-10 flashcards per 1,000 characters of input text
- FR-003: Generated flashcards shall maintain context relevance score of minimum 75%
- FR-004: System shall present generated flashcards for user review before saving

### 3.2 Manual Flashcard Creation

- FR-005: Users shall create flashcards with front side text (10-500 characters)
- FR-006: Users shall create flashcards with back side text (10-1,000 characters)
- FR-007: System shall validate character limits with real-time feedback

### 3.3 Flashcard Management

- FR-008: Users shall view all flashcards in card view format
- FR-009: Users shall edit existing flashcards with same character constraints
- FR-010: Users shall delete individual or multiple flashcards
- FR-011: System shall store maximum 500 flashcards per user account
- FR-012: System shall display current flashcard count and remaining capacity

### 3.4 User Authentication & Account Management

- FR-013: System shall provide email-based registration via Supabase
- FR-014: System shall implement secure password authentication
- FR-015: Users shall reset passwords via email verification
- FR-016: Account deletion shall permanently remove all user data within 24 hours
- FR-017: System shall maintain user sessions with automatic timeout after 30 days

### 3.5 Spaced Repetition Learning System

- FR-018: System shall implement open-source spaced repetition algorithm
- FR-019: Algorithm shall calculate optimal review intervals for each flashcard
- FR-020: System shall determine daily new card introduction rate
- FR-021: System shall maintain study streak counter (consecutive days)

### 3.6 AI Generation Management

- FR-022: System shall enforce global monthly budget limit for AI generation
- FR-023: System shall provide fallback to manual creation when limits reached

## 4. Product Boundaries

### 4.1 In Scope for MVP

- AI-powered flashcard generation from plain text input
- Manual flashcard creation and editing
- Basic flashcard management (CRUD operations)
- Simple user authentication and account system
- Integration with existing spaced repetition algorithm
- Web-based responsive interface
- Study streak tracking
- Basic progress metrics

### 4.2 Out of Scope for MVP

- Custom or advanced spaced repetition algorithms (SuperMemo, Anki-level complexity)
- File format imports (PDF, DOCX, EPUB, etc.)
- Social features or flashcard set sharing between users
- Integration with external educational platforms
- Mobile applications (iOS/Android)
- Offline functionality
- Image or multimedia flashcards
- Collaborative deck creation
- Advanced analytics and reporting
- Gamification elements beyond streak tracking
- Multiple language support (initially English only)
- Browser extensions or plugins

### 4.3 Future Considerations (Post-MVP)

- Mobile application development
- Advanced file format support
- Community marketplace for flashcard sets
- Premium tier with enhanced AI models
- Integration with learning management systems

## 5. User Stories

### 5.1 Authentication & Account Management

#### US-001

- Title: User Registration
- Description: As a new user, I want to create an account using my email and password so that I can save and access my flashcards
- Acceptance Criteria:
  - User can access registration form from landing page
  - Email validation prevents invalid formats
  - Password must meet minimum security requirements (8 characters, 1 number, 1 special character)
  - Duplicate email addresses are rejected with appropriate message
  - Successful registration automatically logs user in
  - Confirmation email is sent to verify account

#### US-002

- Title: User Login
- Description: As a registered user, I want to log in to my account so that I can access my saved flashcards
- Acceptance Criteria:
  - Login form accessible from main navigation
  - Invalid credentials display appropriate error message
  - Successful login redirects to dashboard
  - "Remember me" option maintains session for 30 days

#### US-003

- Title: Password Reset
- Description: As a user, I want to reset my forgotten password so that I can regain access to my account
- Acceptance Criteria:
  - Password reset link accessible from login page
  - System sends reset email to registered address
  - Reset link expires after 24 hours
  - New password must meet security requirements
  - User receives confirmation of successful password change

#### US-004

- Title: Account Deletion
- Description: As a user, I want to permanently delete my account and all associated data
- Acceptance Criteria:
  - Account deletion option available in account settings
  - System requires password confirmation before deletion
  - Warning message clearly states data permanence
  - All user data removed within 24 hours
  - Deletion confirmation email sent to user

### 5.2 AI-Powered Flashcard Generation

#### US-005

- Title: Generate Flashcards from Text
- Description: As a student, I want to paste my study material and receive AI-generated flashcards so that I can quickly create study materials
- Acceptance Criteria:
  - Text input field accepts 1,000-10,000 characters
  - Character counter shows current/maximum characters
  - Generate button triggers AI processing
  - Loading indicator displays during generation
  - System generates flashcards with size limits as for users

#### US-006

- Title: Review AI-Generated Flashcards
- Description: As a learner, I want to review and edit AI suggestions before accepting them so that I can ensure quality
- Acceptance Criteria:
  - Generated flashcards display in preview mode
  - Each card shows accept, edit, and reject options
  - Bulk accept/reject actions available
  - Edit mode allows modification within character limits
  - Accepted cards save to user collection
  - Rejected cards are discarded

#### US-007

- Title: AI Generation Failure Handling
- Description: As a user, I want appropriate feedback when AI generation fails so that I can take alternative action
- Acceptance Criteria:
  - Error message explains failure reason
  - System suggests manual creation as alternative
  - Previously entered text is preserved
  - Option to retry generation if temporary issue
  - Support contact provided for persistent issues

### 5.3 Manual Flashcard Management

#### US-008

- Title: Create Manual Flashcard
- Description: As a user, I want to manually create flashcards when AI generation is unavailable or unsuitable
- Acceptance Criteria:
  - Create flashcard button accessible from dashboard
  - Front side accepts 10-500 characters
  - Back side accepts 10-1,000 characters
  - Real-time character count validation
  - Save button enabled only with valid input
  - Confirmation message on successful creation

#### US-009

- Title: Edit Existing Flashcard
- Description: As a user, I want to edit my existing flashcards to correct or improve them
- Acceptance Criteria:
  - Edit button available on each flashcard
  - Original content pre-populated in edit form
  - Character limit validation enforced
  - Cancel option restores original content
  - Save updates flashcard immediately
  - Last modified timestamp updated

#### US-010

- Title: Delete Flashcards
- Description: As a user, I want to delete flashcards that are no longer needed
- Acceptance Criteria:
  - Delete option available for individual cards
  - Confirmation dialog prevents accidental deletion
  - Bulk delete option for multiple cards
  - Deleted cards removed immediately from view
  - Flashcard count updates automatically
  - Undo option available for 10 seconds after deletion

#### US-011

- Title: View Flashcard Collection
- Description: As a user, I want to view all my flashcards in an organized manner
- Acceptance Criteria:
  - Dashboard displays total flashcard count
  - List view shows all flashcards with pagination (20 per page)
  - Card view allows flipping between front and back
  - Search functionality filters cards by content
  - Sort options by creation date or last modified
  - Storage capacity indicator (current/500 cards)

### 5.4 Spaced Repetition Learning

#### US-012

- Title: Start Study Session
- Description: As a student, I want to study my flashcards using spaced repetition to efficiently memorize content
- Acceptance Criteria:
  - Study button prominent on dashboard
  - Session includes due cards and new cards
  - Daily new card limit enforced (5-20 cards - TBD how)
  - Cards presented front-side first
  - Reveal button shows back side
  - Users states how well he aquire knowledge from flashcard

#### US-013

- Title: Track Study Progress
- Description: As a user, I want to see my learning progress to stay motivated
- Acceptance Criteria:
  - Dashboard shows cards due today
  - Study streak counter displays consecutive days
  - Streak resets if day skipped
  - Visual indicator for streak milestones (7, 30, 100 days)
  - Daily study reminder notification option
  - Session summary shows cards reviewed

#### US-014

- Title: Complete Study Session
- Description: As a user, I want to complete my daily study session and see my progress
- Acceptance Criteria:
  - Session ends when no cards remain
  - Summary shows cards studied and ratings
  - Next review date calculated for each card
  - Streak updates if first session of day
  - Motivation message based on performance
  - Return to dashboard option

## 6. Success Metrics

- AI Acceptance Rate: 75% of AI-generated flashcards accepted without modification
- AI Usage Rate: 75% of total flashcards created using AI generation
