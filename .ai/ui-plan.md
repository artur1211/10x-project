# UI Architecture for 10x-project

## 1. UI Structure Overview

The 10x-project is a web-based flashcard generation and learning platform built with Astro 5's multi-page architecture and View Transitions API. The application uses a hybrid rendering approach where Astro components handle static content and React 19 components provide interactivity through partial hydration. The UI is organized around four main sections accessible via persistent top navigation: Generate Flashcards, Study, Flashcards Library, and Profile. The system prioritizes mobile-first responsive design with breakpoints at 320px (mobile), 768px (tablet), and 1024px+ (desktop).

## 2. View List

### 2.1 Landing Page

- **View path:** `/`
- **Main purpose:** Introduce the product and encourage user registration
- **Key information to display:**
  - Value proposition: "Reduce flashcard creation time by 75%"
  - Core features overview
  - User testimonials or statistics
  - Clear CTAs for registration and login
- **Key view components:**
  - Hero section with headline and subheadline
  - Feature cards highlighting AI generation, spaced repetition, and streak tracking
  - CTA buttons (primary: Sign Up, secondary: Login)
  - Footer with legal links
- **UX, accessibility, and security considerations:**
  - Skip navigation link for screen readers
  - Semantic HTML5 landmarks
  - Accessible color contrast (WCAG AA)
  - No sensitive data exposed

### 2.2 Registration Page

- **View path:** `/register`
- **Main purpose:** Create new user account via Supabase Auth
- **Key information to display:**
  - Registration form with email and password fields
  - Password requirements (8+ chars, 1 number, 1 special character)
  - Link to existing user login
  - Terms of service acknowledgment
- **Key view components:**
  - Email input with format validation
  - Password input with requirements checklist
  - Password confirmation field
  - Submit button (disabled until valid)
  - Login redirect link
  - Inline error messages
- **UX, accessibility, and security considerations:**
  - Real-time validation feedback
  - aria-describedby for field requirements
  - Password strength indicator
  - Secure password handling (no client-side storage)
  - Auto-redirect to Generate Flashcards page after success

### 2.3 Login Page

- **View path:** `/login`
- **Main purpose:** Authenticate existing users
- **Key information to display:**
  - Login form with email/password
  - Remember me option (30-day session)
  - Password reset link
  - Registration link for new users
- **Key view components:**
  - Email input field
  - Password input field
  - Remember me checkbox
  - Submit button
  - Forgot password link
  - Register account link
  - Error message container
- **UX, accessibility, and security considerations:**
  - Clear error messages for invalid credentials
  - Keyboard navigation support
  - Secure session token handling
  - Rate limiting indication if applicable

### 2.4 Password Reset Page

- **View path:** `/reset-password`
- **Main purpose:** Reset forgotten password via email
- **Key information to display:**
  - Email input for reset link
  - Instructions for reset process
  - Confirmation message after submission
  - Return to login link
- **Key view components:**
  - Email input field
  - Submit button
  - Success/error message container
  - Back to login link
- **UX, accessibility, and security considerations:**
  - Clear instructions about email delivery
  - 24-hour expiry notice for reset links
  - No user enumeration vulnerability
  - Success message regardless of email existence

### 2.5 Generate Flashcards Page

- **View path:** `/generate`
- **Main purpose:** AI-powered flashcard generation from text input
- **Key information to display:**
  - Large text input area (1,000-10,000 characters)
  - Real-time character counter
  - Generated cards review interface
  - Bulk and individual card actions
- **Key view components:**
  - Textarea with character counter (color-coded: green/yellow/red)
  - Generate button (disabled when invalid)
  - Loading indicator with message
  - Card review grid showing all generated cards
  - Individual card actions (Accept/Reject/Edit buttons)
  - Bulk action bar (Accept All/Reject All)
  - Edit modal for card modification
  - Success confirmation after saving
- **UX, accessibility, and security considerations:**
  - aria-live region for character count updates
  - Loading state with aria-busy
  - Clear feedback for API limits (429 errors)

### 2.6 Flashcards Library Page

- **View path:** `/flashcards`
- **Main purpose:** Manage and organize flashcard collection
- **Key information to display:**
  - All user flashcards with search/filter
  - Current capacity (e.g., "95/500 flashcards")
  - Card preview with edit/delete options
  - View toggle (grid/list)
- **Key view components:**
  - Search bar with debouncing
  - Sort dropdown (created date, modified date)
  - View toggle buttons (grid/list)
  - Flashcard grid/list:
    - Desktop: 3 columns
    - Tablet: 2 columns
    - Mobile: 1 column
  - Card component with front text preview
  - Edit/Delete action buttons per card
  - Create new flashcard button
  - Capacity indicator (color-coded)
  - Pagination or infinite scroll
- **UX, accessibility, and security considerations:**
  - View preference persisted to localStorage
  - Confirmation dialog for deletions
  - Bulk selection for multiple deletions
  - aria-label for icon buttons
  - Responsive touch targets (min 44x44px)

### 2.7 Study Page

- **View path:** `/study`
- **Main purpose:** Spaced repetition study session interface
- **Key information to display:**
  - Current flashcard (front/back)
  - Session progress indicator
  - Cards remaining count
  - Difficulty rating options
- **Key view components:**
  - Progress bar or counter
  - Flashcard display area
  - Show/hide answer button
  - Rating buttons (Again/Hard/Good/Easy)
  - Keyboard shortcut hints
  - Session info panel (cards due, new cards)
  - Pause/End session button
- **UX, accessibility, and security considerations:**
  - Keyboard navigation (Space: reveal, 1-4: ratings)
  - aria-current for progress tracking
  - Session state persisted to localStorage
  - Recovery prompt for incomplete sessions
  - Screen reader announcements for card changes

### 2.8 Study Summary Page

- **View path:** `/study/summary`
- **Main purpose:** Display session completion statistics
- **Key information to display:**
  - Cards reviewed count
  - Rating distribution
  - Streak status update
  - Next review schedule
- **Key view components:**
  - Statistics cards (reviewed, ratings breakdown)
  - Streak widget with milestone indicators
  - Performance chart or visual
  - "Return to Dashboard" button
  - "Study Again" button (if cards remain)
  - Motivational message based on performance
- **UX, accessibility, and security considerations:**
  - Clear visual hierarchy for statistics
  - Accessible data presentation
  - Auto-save session results
  - Celebration animation for milestones

### 2.9 Profile/Settings Page

- **View path:** `/profile`
- **Main purpose:** Account management and app settings
- **Key information to display:**
  - User email and account info
  - Study statistics and streak
  - Theme preference
  - Account actions
- **Key view components:**
  - User info section
  - Streak statistics widget
  - Theme toggle (light/dark/system)
  - Daily study goal setter
  - Logout button
  - Delete account button (with confirmation)
  - Settings sections (notifications, preferences)
- **UX, accessibility, and security considerations:**
  - Theme preference synced across devices
  - Confirmation dialog for destructive actions
  - Clear data export options (future)
  - Accessible form controls

## 3. User Journey Map

### 3.1 Primary Journey: New User Onboarding to First Study Session

1. **Discovery** → User lands on Landing Page
2. **Registration** → Clicks "Get Started" → Registration Page
3. **Account Creation** → Completes registration form → Auto-redirect to Generate Flashcards
4. **First Generation** → Pastes study material (1,000-10,000 chars) → Clicks "Generate"
5. **AI Processing** → Views loading indicator → Waits for generation
6. **Card Review** → Reviews all generated cards simultaneously
7. **Card Selection** → Uses bulk "Accept All" or individually accepts/rejects/edits cards
8. **Save Confirmation** → Confirms selection → Cards saved to library
9. **Study Navigation** → Clicks "Study" in top navigation
10. **Study Session** → Starts session → Reviews cards with show/hide mechanism
11. **Card Rating** → Rates each card's difficulty → Progress saved to localStorage
12. **Session Completion** → Completes all due cards → Views summary
13. **Return Flow** → Returns to main interface → Continues with more generation or study

### 3.2 Returning User Journey

1. **Authentication** → Login Page → Enter credentials
2. **Dashboard Access** → Redirect to last visited section or Study page
3. **Resume Check** → System checks for incomplete session → Offers resume option
4. **Activity Selection** → Choose between Study, Generate, or Manage flashcards
5. **Task Completion** → Complete desired activity
6. **Continuous Learning** → Maintain streak through daily sessions

### 3.3 Manual Flashcard Creation Journey

1. **Library Access** → Navigate to Flashcards Library
2. **Create New** → Click "Create Flashcard" button
3. **Content Entry** → Enter front (10-500 chars) and back (10-1,000 chars)
4. **Validation** → Real-time character counting and validation
5. **Save** → Submit valid flashcard → Added to collection
6. **Continue** → Create more or return to library

## 4. Layout and Navigation Structure

### 4.1 Global Navigation

**Persistent Top Navigation Bar:**

- Logo/Brand (left) - links to authenticated home
- Primary sections (center/right):
  - Generate Flashcards
  - Study
  - Flashcards
  - Profile
- Capacity indicator (e.g., "95/500")
- Theme toggle icon

**Navigation Behavior:**

- Active state indication with underline or background
- Responsive collapse on mobile (hamburger menu)
- Sticky positioning on scroll
- Hidden on authentication pages

### 4.2 Page Layout Structure

**Standard Page Template:**

```
┌─────────────────────────────────────┐
│         Top Navigation              │
├─────────────────────────────────────┤
│                                     │
│         Main Content Area           │
│                                     │
│  ┌──────────────────────────────┐   │
│  │                              │   │
│  │     Page-Specific Content    │   │
│  │                              │   │
│  └──────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### 4.3 Responsive Breakpoints

- **Mobile:** 320px - 767px (single column, stacked elements)
- **Tablet:** 768px - 1023px (2 column grids, condensed navigation)
- **Desktop:** 1024px+ (multi-column, full navigation)

## 5. Key Components

### 5.1 Flashcard Component

- Displays front and back text
- Show/hide mechanism for answer reveal
- Edit and delete action buttons
- Character count indicators
- AI-generated badge (when applicable)

### 5.2 Character Counter

- Real-time updates on input
- Color-coded feedback (green: valid, yellow: warning, red: exceeded)
- Displays current/maximum characters
- Screen reader announcements at thresholds

### 5.3 Capacity Indicator

- Shows current flashcard count vs limit (e.g., "95/500")
- Color-coded visual bar:
  - Green: 0-300 cards
  - Yellow: 301-450 cards
  - Red: 451-500 cards
- Click to view detailed breakdown

### 5.4 Streak Widget

- Current streak display with flame icon
- Milestone badges (7, 30, 100 days)
- Progress bar to next milestone
- Motivational messages
- Calendar heatmap (future enhancement)

### 5.5 Loading Indicator

- Animated spinner or progress animation
- Contextual message (e.g., "Generating your flashcards...")
- aria-busy attribute for accessibility
- Prevents user interaction during loading

### 5.6 Error Message Component

- Inline display for form validation
- Toast notifications for system errors
- Icon indication (warning/error/info)
- Actionable suggestions when applicable
- aria-live region for announcements

### 5.7 Empty State Component

- Contextual illustration or icon
- Descriptive message
- Primary action button
- Used for: no flashcards, no due cards, no search results

### 5.8 Modal Dialog

- Overlay with backdrop
- Focus trap implementation
- Close on ESC key
- Used for: edit flashcard, confirmations, settings

### 5.9 Theme Toggle

- Light/Dark/System options
- Icon indication of current mode
- Smooth transition between themes
- Preference persistence in localStorage

### 5.10 Search Bar

- Debounced input (300ms)
- Clear button when content present
- Loading state during search
- Result count display
- Filters both front and back text
