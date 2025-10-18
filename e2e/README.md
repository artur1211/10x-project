# E2E Testing Guide

This directory contains End-to-End (E2E) tests for the 10x-project flashcard generation platform using Playwright.

## Test Architecture

### True E2E Tests with Database Integration

Our E2E tests follow a **true end-to-end approach** where:

- ✅ Real API endpoints are called
- ✅ Real database operations are performed
- ✅ Real authentication flow is used
- ✅ External AI API (OpenRouter) is mocked using MSW

This ensures we test the **actual integration** between frontend, backend, and database.

## Setup Requirements

### 1. Environment Variables

Create a `.env.test` file in the project root with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key

# Test User Credentials
E2E_USERNAME=test@example.com
E2E_PASSWORD=YourTestPassword123!
E2E_USERNAME_ID=uuid-of-test-user

# OpenRouter API (not required for E2E tests - mocked by MSW)
# You can leave this empty or omit it entirely
OPENROUTER_API_KEY=
```

### 2. Test User Setup

Create a test user in your Supabase database:

1. Sign up a test user through your application UI or Supabase dashboard
2. Use the credentials that match your `.env.test` file
3. Copy the user's UUID to `E2E_USERNAME_ID`

### 3. Database Permissions

The test cleanup uses the test user's credentials (not service role key) to delete test data. Ensure your RLS policies allow users to delete their own:
- `flashcards` records
- `ai_generation_batches` records

This should already be configured if users can create/manage their own flashcards.

## Test Structure

### Directory Layout

```
e2e/
├── fixtures/           # Test data and mock responses
│   └── sample-text.ts
├── helpers/            # Reusable test utilities
│   ├── auth.ts         # Authentication helpers
│   └── database.ts     # Database cleanup utilities
├── mocks/              # MSW mock handlers
│   ├── handlers.ts     # API request handlers
│   └── server.ts       # MSW server setup
├── page-objects/       # Page Object Model classes
│   └── FlashcardGeneratorPage.ts
├── global-setup.ts     # Global setup (DB cleanup)
├── global-teardown.ts  # Global teardown (DB cleanup)
├── setup-msw.mjs       # MSW initialization (loaded via NODE_OPTIONS)
├── flashcard-generation.spec.ts  # Test specs
└── README.md           # This file
```

### Helper Files

#### `helpers/auth.ts`
- `login(page)` - Logs in via UI
- `loginViaAPI(page)` - Logs in via API (faster)
- `logout(page)` - Logs out
- `TEST_USER` - Test user credentials from env

#### `helpers/database.ts`
- `cleanupUserTestData(userId)` - Deletes all test data for a user
- `getUserFlashcardCount(userId)` - Gets flashcard count
- `getUserBatchCount(userId)` - Gets batch count
- `getUserFlashcards(userId)` - Fetches all flashcards
- `getUserBatches(userId)` - Fetches all batches

#### `mocks/handlers.ts` & `mocks/server.ts`
- MSW (Mock Service Worker) setup for intercepting server-side API calls
- Mocks OpenRouter API responses with predefined flashcard data
- Runs in Node.js environment (not browser)

## Test Lifecycle

### Global Setup (Before All Tests)
1. Loads environment variables from `.env.test`
2. **Cleans up any leftover test data** from previous runs
3. Ensures tests start with a clean database state

Note: MSW server starts automatically via `NODE_OPTIONS` flag in `playwright.config.ts`

See: `e2e/global-setup.ts`

### beforeEach Hook
1. Creates FlashcardGeneratorPage instance
2. Logs in via UI
3. Navigates to the generate page

Note: OpenRouter API is mocked globally by MSW server

### Global Teardown (After All Tests)
1. **Cleans up all test data from database** (flashcards + batches)
2. Runs regardless of test outcomes (pass/fail/skip)
3. Ensures database is clean for the next test run

Note: MSW server stops automatically when the dev server stops

See: `e2e/global-teardown.ts`

This approach:
- ✅ Uses Playwright's recommended global setup/teardown pattern
- ✅ More efficient than cleaning after each test
- ✅ Allows you to inspect database state during debugging
- ✅ Ensures cleanup happens even if tests fail

## What We Test

### Database Integration
- ✅ Batch records are created in `ai_generation_batches` table
- ✅ Flashcards are saved to `flashcards` table
- ✅ Accepted cards are saved
- ✅ Edited cards are saved with `was_edited: true`
- ✅ Rejected cards are NOT saved
- ✅ Correct counts and statistics

### API Endpoints
- ✅ `POST /api/flashcards/batch` - Generation endpoint
- ✅ `POST /api/flashcards/batch/:batchId/review` - Review endpoint

### Frontend UI
- ✅ Form validation
- ✅ Loading states
- ✅ Card review UI
- ✅ Bulk actions
- ✅ Success modal
- ✅ Navigation

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run specific test file
```bash
npx playwright test flashcard-generation.spec.ts
```

### Run in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run in debug mode
```bash
npx playwright test --debug
```

### View test report
```bash
npx playwright show-report
```

## Mocking Strategy

### How MSW Works

We use **MSW (Mock Service Worker)** to intercept server-side fetch calls:

1. MSW is loaded via `NODE_OPTIONS='--import ./e2e/setup-msw.mjs'` when starting the dev server
2. MSW runs in the **same Node.js process** as the Astro server
3. When your Astro API routes call OpenRouter, MSW intercepts the fetch
4. MSW returns predefined flashcard data instead of making real API calls
5. MSW stops automatically when the dev server stops

This approach:
- ✅ Mocks server-side fetch calls in the same process
- ✅ No modifications to production code
- ✅ Industry-standard mocking solution
- ✅ Works seamlessly with Astro's server-side rendering

See: `e2e/setup-msw.mjs` and `playwright.config.ts` (webServer command)

### What We Mock
- **OpenRouter AI API** - Mocked using MSW at the Node.js fetch level
  - Reason: Avoid real API costs and unpredictable AI responses
  - Returns consistent flashcard data for testing

### What We DON'T Mock
- ❌ Backend API endpoints (`/api/flashcards/*`)
- ❌ Database operations
- ❌ Authentication flow
- ❌ Supabase client

This hybrid approach gives us:
- **Fast, reliable tests** (AI responses are consistent)
- **Real integration testing** (backend + database actually work)
- **Cost effective** (no real AI API calls)
- **Clean architecture** (no test code in production files)

## Debugging Tests

### Check Database State
Use the helper functions to inspect database state during tests:

```typescript
import { getUserFlashcards, getUserBatches } from "./helpers/database";

// In your test
const flashcards = await getUserFlashcards(TEST_USER.id);
console.log("Flashcards in DB:", flashcards);

const batches = await getUserBatches(TEST_USER.id);
console.log("Batches in DB:", batches);
```

**Note:** With global teardown, test data accumulates during test execution and is cleaned up at the end. This is intentional and allows you to inspect database state while debugging.

### View Network Requests
Enable Playwright trace to see all network requests:

```bash
npx playwright test --trace on
npx playwright show-report
```

### Check Test Data Cleanup
Database cleanup happens automatically in global teardown. To manually trigger cleanup:

```typescript
import { cleanupUserTestData } from "./helpers/database";
await cleanupUserTestData(TEST_USER.id);
```

This is useful if you need to reset the database mid-debugging.

## Common Issues

### Tests fail with "User not found"
- Ensure test user exists in Supabase
- Verify `E2E_USERNAME_ID` matches the user's UUID

### Tests fail with "Permission denied"
- Ensure test user can delete their own flashcards and batches
- Check Row Level Security (RLS) policies allow users to delete their own records
- The test uses user credentials, not service role key

### Database not cleaning up
- Verify test user credentials are correct in `.env.test`
- Check that user can delete their own flashcards and batches
- Check for foreign key constraints (flashcards should be deleted before batches)

### OpenRouter mock not working
- MSW should start automatically when dev server starts
- Check console output for "MSW server started" message when tests begin
- Verify `e2e/setup-msw.mjs` file exists
- Ensure `NODE_OPTIONS` is set correctly in `playwright.config.ts`
- Check that URL matches: `https://openrouter.ai/api/v1/chat/completions`

## Best Practices

1. **Trust global setup/teardown** - Database cleanup is automatic
2. **Verify database state** - Assert that database reflects expected state
3. **Use relative comparisons** - Check `initialCount + 4` instead of hardcoded values
4. **Use Page Objects** - Keep selectors and actions in Page Object classes
5. **Descriptive test names** - Clearly indicate what is being tested
6. **Arrange-Act-Assert** - Structure tests with clear phases
7. **Wait for elements** - Use Playwright's auto-waiting features
8. **Avoid hardcoded waits** - Use `waitForLoadState`, `waitForSelector`, etc.

## Future Improvements

- [ ] Add tests for error scenarios (API failures, validation errors)
- [ ] Add tests for flashcard limits (500 card limit)
- [ ] Add performance testing for large batches
- [ ] Add visual regression testing with screenshots
- [ ] Add accessibility testing with axe-core
