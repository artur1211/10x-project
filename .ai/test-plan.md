# Test Plan for 10x-project

## 1. Introduction and Testing Objectives

### 1.1 Project Overview

The 10x-project is an AI-powered flashcard generation platform designed to help students create study materials using spaced repetition. The platform allows users to transform text into flashcards automatically via AI or create them manually, then study using an optimized spaced repetition algorithm.

### 1.2 Testing Objectives

The primary objectives of this test plan are to:

- Ensure the security and reliability of the authentication system
- Validate the AI-powered flashcard generation functionality
- Verify data integrity and user data isolation in the Supabase database
- Confirm proper error handling and user feedback mechanisms
- Ensure seamless integration between frontend components and backend services
- Validate performance under various load conditions
- Ensure accessibility and usability standards are met
- Verify proper handling of external API dependencies (OpenRouter, Supabase)

## 2. Scope of Tests

### 2.1 In Scope

**Authentication System:**

- User registration with email verification
- User login and session management
- Password recovery and reset flows
- Session persistence and timeout handling
- Protected route access control

**Flashcard Generation:**

- Text input validation (1000-10000 characters)
- AI-powered flashcard generation via OpenRouter
- Batch creation and management
- Card preview and editing
- Review decisions (accept/reject/edit)
- Flashcard limit enforcement (500 cards per user)

**API Endpoints:**

- All authentication endpoints (`/api/auth/*`)
- Flashcard generation endpoints (`/api/flashcards/batch/*`)
- Error response formats and status codes

**Data Validation:**

- Zod schema validation for all inputs
- Type safety across TypeScript interfaces
- Database constraint enforcement

**Error Handling:**

- Custom error classes and error hierarchy
- User-friendly error messages
- API retry logic for external services

**Frontend Components:**

- React components for flashcard generation
- Authentication forms
- UI components from Shadcn/ui
- Custom hooks for state management

### 2.2 Out of Scope

**Future Features:**

- Study session functionality (planned but not yet implemented)
- Spaced repetition algorithm (future implementation)
- Card review interface for studying (future implementation)
- Progress tracking features (future implementation)

**Infrastructure:**

- Supabase configuration and setup
- OpenRouter API configuration
- DigitalOcean deployment configuration
- GitHub Actions CI/CD pipeline setup (unless test integration is required)

### 2.3 Testing Environment Boundaries

- Testing will focus on development and staging environments
- Production testing will be limited to smoke tests and monitoring
- External API testing will use mocking and stubbing strategies

## 3. Types of Tests

### 3.1 Unit Tests

**Purpose:** Validate individual functions, methods, and components in isolation.

**Areas to Cover:**

- Zod validation schemas (`auth.schemas.ts`, `flashcardBatch.schemas.ts`)
- Service layer methods (`flashcardBatch.service.ts`, `openrouter.service.ts`)
- Custom error classes and error handling logic
- React custom hooks (`useFlashcardGeneration.ts`)
- Utility functions and helpers
- Component rendering and props validation

**Tools:** Vitest, React Testing Library, MSW (Mock Service Worker)

### 3.2 End-to-End Tests

**Purpose:** Simulate real user scenarios from start to finish.

**Critical User Flows:**

1. User registration → Email verification → Login
2. Login → Navigate to generate page → Input text → Generate flashcards → Review and save
3. Password reset flow from start to finish
4. Protected route access without authentication
5. Flashcard limit enforcement (creating 500+ cards)

**Tools:** Playwright

### 3.3 Validation Tests

**Purpose:** Ensure all input validation is working correctly.

**Coverage:**

- Email format validation
- Password strength requirements
- Character count validation (1000-10000 for input text)
- Flashcard content length validation
- UUID format validation
- Zod schema validation across all endpoints

**Tools:** Vitest, Manual testing

## 4. Test Scenarios for Key Functionalities

### 4.1 Authentication System

#### 4.1.1 User Registration

**Test Scenarios:**

| ID          | Scenario                                         | Expected Result                                             | Priority |
| ----------- | ------------------------------------------------ | ----------------------------------------------------------- | -------- |
| AUTH-REG-01 | Register with valid email and strong password    | Account created, verification email sent                    | HIGH     |
| AUTH-REG-02 | Register with weak password (< 8 chars)          | Error: Password must be at least 8 characters               | HIGH     |
| AUTH-REG-03 | Register with password missing number            | Error: Password must contain at least one number            | HIGH     |
| AUTH-REG-04 | Register with password missing special character | Error: Password must contain at least one special character | HIGH     |
| AUTH-REG-05 | Register with invalid email format               | Error: Invalid email format                                 | HIGH     |
| AUTH-REG-06 | Register with existing email                     | Error: Email already registered                             | HIGH     |
| AUTH-REG-07 | Register without accepting terms                 | Error: Must accept terms and conditions                     | MEDIUM   |
| AUTH-REG-08 | Register with mismatched password confirmation   | Error: Passwords do not match                               | HIGH     |

#### 4.1.2 User Login

**Test Scenarios:**

| ID            | Scenario                         | Expected Result                                 | Priority |
| ------------- | -------------------------------- | ----------------------------------------------- | -------- |
| AUTH-LOGIN-01 | Login with valid credentials     | Successfully logged in, redirected to dashboard | HIGH     |
| AUTH-LOGIN-02 | Login with invalid email         | Error: Invalid credentials                      | HIGH     |
| AUTH-LOGIN-03 | Login with invalid password      | Error: Invalid credentials                      | HIGH     |
| AUTH-LOGIN-04 | Login without email verification | Error: Email not verified                       | HIGH     |
| AUTH-LOGIN-05 | Login with redirect parameter    | Redirected to specified page after login        | MEDIUM   |
| AUTH-LOGIN-06 | Login when already authenticated | Redirected to dashboard                         | MEDIUM   |
| AUTH-LOGIN-07 | Multiple failed login attempts   | Account locked or rate limited                  | HIGH     |

#### 4.1.3 Password Recovery

**Test Scenarios:**

| ID             | Scenario                                | Expected Result                            | Priority |
| -------------- | --------------------------------------- | ------------------------------------------ | -------- |
| AUTH-FORGOT-01 | Request reset with valid email          | Reset email sent (generic success message) | HIGH     |
| AUTH-FORGOT-02 | Request reset with non-existent email   | Generic success message (no enumeration)   | HIGH     |
| AUTH-FORGOT-03 | Request reset with invalid email format | Error: Invalid email format                | MEDIUM   |
| AUTH-RESET-01  | Reset password with valid token         | Password updated successfully              | HIGH     |
| AUTH-RESET-02  | Reset password with expired token       | Error: Token expired or invalid            | HIGH     |
| AUTH-RESET-03  | Reset password with weak password       | Error: Password requirements not met       | HIGH     |
| AUTH-RESET-04  | Reset password with used token          | Error: Token already used                  | HIGH     |

#### 4.1.4 Session Management

**Test Scenarios:**

| ID              | Scenario                                      | Expected Result                      | Priority |
| --------------- | --------------------------------------------- | ------------------------------------ | -------- |
| AUTH-SESSION-01 | Access protected route without authentication | Redirected to login page             | HIGH     |
| AUTH-SESSION-02 | Session persists after browser refresh        | User remains logged in               | HIGH     |
| AUTH-SESSION-03 | Session expires after timeout                 | User logged out, redirected to login | MEDIUM   |
| AUTH-SESSION-04 | Logout functionality                          | Session cleared, redirected to home  | HIGH     |
| AUTH-SESSION-05 | Access public routes when authenticated       | Pages accessible without redirect    | MEDIUM   |

### 4.2 Flashcard Generation

#### 4.2.1 Text Input Validation

**Test Scenarios:**

| ID          | Scenario                          | Expected Result                          | Priority |
| ----------- | --------------------------------- | ---------------------------------------- | -------- |
| FC-INPUT-01 | Submit text with 1000 characters  | Validation passes, generation starts     | HIGH     |
| FC-INPUT-02 | Submit text with 10000 characters | Validation passes, generation starts     | HIGH     |
| FC-INPUT-03 | Submit text with 999 characters   | Error: Minimum 1000 characters required  | HIGH     |
| FC-INPUT-04 | Submit text with 10001 characters | Error: Maximum 10000 characters exceeded | HIGH     |
| FC-INPUT-05 | Submit empty text                 | Error: Text is required                  | HIGH     |
| FC-INPUT-06 | Submit text with only whitespace  | Error: Invalid text content              | MEDIUM   |

#### 4.2.2 AI Generation

**Test Scenarios:**

| ID        | Scenario                                 | Expected Result                             | Priority |
| --------- | ---------------------------------------- | ------------------------------------------- | -------- |
| FC-GEN-01 | Generate flashcards with valid text      | Cards generated successfully, batch created | HIGH     |
| FC-GEN-02 | OpenRouter API returns error             | User-friendly error message, retry option   | HIGH     |
| FC-GEN-03 | OpenRouter API timeout                   | Timeout error, retry option                 | HIGH     |
| FC-GEN-04 | OpenRouter API rate limit hit            | Rate limit error with reset time            | HIGH     |
| FC-GEN-05 | Invalid JSON response from AI            | Error: Generation failed, retry option      | MEDIUM   |
| FC-GEN-06 | Generate multiple batches sequentially   | Each batch tracked separately               | MEDIUM   |
| FC-GEN-07 | Generate with special characters in text | Special characters handled correctly        | MEDIUM   |

#### 4.2.3 Card Review Process

**Test Scenarios:**

| ID           | Scenario                            | Expected Result                          | Priority |
| ------------ | ----------------------------------- | ---------------------------------------- | -------- |
| FC-REVIEW-01 | Accept all generated cards          | All cards saved to database              | HIGH     |
| FC-REVIEW-02 | Reject all generated cards          | No cards saved, batch updated            | HIGH     |
| FC-REVIEW-03 | Edit card before accepting          | Edited version saved to database         | HIGH     |
| FC-REVIEW-04 | Mix of accept/reject/edit decisions | Correct cards saved with proper status   | HIGH     |
| FC-REVIEW-05 | Review batch already reviewed       | Error: Batch already reviewed            | HIGH     |
| FC-REVIEW-06 | Review non-existent batch           | Error: Batch not found                   | HIGH     |
| FC-REVIEW-07 | Review another user's batch         | Error: Batch not found (ownership check) | HIGH     |
| FC-REVIEW-08 | Accept cards exceeding 500 limit    | Error: Flashcard limit exceeded          | HIGH     |
| FC-REVIEW-09 | Review with invalid UUID format     | Error: Invalid batch ID                  | MEDIUM   |

#### 4.2.4 Flashcard Limit Enforcement

**Test Scenarios:**

| ID          | Scenario                                 | Expected Result                             | Priority |
| ----------- | ---------------------------------------- | ------------------------------------------- | -------- |
| FC-LIMIT-01 | User with 0 cards accepts 50 cards       | Cards saved successfully                    | HIGH     |
| FC-LIMIT-02 | User with 490 cards accepts 10 cards     | Cards saved successfully, limit reached     | HIGH     |
| FC-LIMIT-03 | User with 490 cards accepts 20 cards     | Error: Would exceed 500 card limit          | HIGH     |
| FC-LIMIT-04 | User with 500 cards tries to accept more | Error: Already at flashcard limit           | HIGH     |
| FC-LIMIT-05 | Concurrent requests causing limit bypass | Limit enforced correctly, one request fails | HIGH     |

### 4.3 Error Handling

#### 4.3.1 Custom Error Classes

**Test Scenarios:**

| ID     | Scenario                           | Expected Result                        | Priority |
| ------ | ---------------------------------- | -------------------------------------- | -------- |
| ERR-01 | BatchNotFoundError thrown          | Proper error message and 404 status    | HIGH     |
| ERR-02 | BatchAlreadyReviewedError thrown   | Proper error message and 400 status    | HIGH     |
| ERR-03 | FlashcardLimitExceededError thrown | Error includes current count and limit | HIGH     |
| ERR-04 | ValidationError thrown             | Error includes validation details      | HIGH     |
| ERR-05 | OpenRouterRateLimitError thrown    | Error includes reset date              | HIGH     |
| ERR-06 | Generic server error               | User-friendly error message shown      | MEDIUM   |

### 4.4 React Components and Hooks

#### 4.4.1 useFlashcardGeneration Hook

**Test Scenarios:**

| ID      | Scenario                                | Expected Result                                     | Priority |
| ------- | --------------------------------------- | --------------------------------------------------- | -------- |
| HOOK-01 | Initialize hook                         | State is idle                                       | HIGH     |
| HOOK-02 | Call generateFlashcards with valid text | State transitions: idle → generating → reviewing    | HIGH     |
| HOOK-03 | Generation fails                        | State returns to idle, error set                    | HIGH     |
| HOOK-04 | Edit card in review state               | Card updates correctly                              | MEDIUM   |
| HOOK-05 | Submit review decisions                 | State transitions: reviewing → submitting → success | HIGH     |
| HOOK-06 | Review submission fails                 | Error displayed, stays in reviewing state           | HIGH     |

#### 4.4.2 FlashcardGenerator Component

**Test Scenarios:**

| ID      | Scenario                              | Expected Result                | Priority |
| ------- | ------------------------------------- | ------------------------------ | -------- |
| COMP-01 | Component renders in idle state       | Shows input form               | HIGH     |
| COMP-02 | Component renders in generating state | Shows loading indicator        | HIGH     |
| COMP-03 | Component renders in reviewing state  | Shows card review grid         | HIGH     |
| COMP-04 | Component renders in success state    | Shows success confirmation     | HIGH     |
| COMP-05 | Component renders error state         | Shows error display with retry | HIGH     |

## 5. Test Environment

### 5.1 Development Environment

**Purpose:** Active development and unit testing

**Configuration:**

- Local Supabase instance or development project
- OpenRouter API with development keys
- Mock data for rapid testing
- Hot reload enabled
- Debug logging enabled

**Access:**

- URL: `http://localhost:3000`
- Database: Development Supabase project
- AI Service: OpenRouter development account

## 6. Testing Tools

### 6.1 Unit and Integration Testing

**Primary Framework: Vitest**

- **Rationale:** Modern, fast test runner with excellent TypeScript support and Vite integration
- **Configuration:** `vitest.config.ts` with proper path aliases
- **Usage:**
  - Unit tests for services, utilities, and schemas
  - Integration tests for API endpoints
  - Snapshot testing where appropriate

**React Testing Library**

- **Purpose:** Component testing with user-centric approach
- **Usage:**
  - Test React components in isolation
  - Verify user interactions
  - Assert on rendered output
  - Test custom hooks

**Mock Service Worker (MSW)**

- **Purpose:** Mock external API calls (OpenRouter, Supabase)
- **Usage:**
  - Intercept HTTP requests in tests
  - Simulate API responses
  - Test error scenarios
  - Control external dependencies

### 6.2 End-to-End Testing

**Playwright**

- **Purpose:** Cross-browser E2E testing
- **Features:**
  - Multi-browser support (Chrome, Firefox, Safari)
  - Network interception
  - Screenshot and video recording
  - Parallel execution
- **Usage:**
  - Critical user flows
  - Multi-page scenarios
  - Form submissions
  - Authentication flows

### 6.3 API Testing

**Vitest + HTTP Mocking**

- **Purpose:** Test Astro API routes independently
- **Usage:**
  - Request/response validation
  - Status code verification
  - Error handling
  - Authentication checks

**Postman/Insomnia (Manual)**

- **Purpose:** Manual API exploration and testing
- **Usage:**
  - Ad-hoc testing during development
  - Documentation examples
  - Debugging complex scenarios

### 6.4 Code Quality and Coverage

**TypeScript Compiler (tsc)**

- **Purpose:** Type checking
- **Usage:** `npm run build` or `npx tsc` before commits

**ESLint**

- **Purpose:** Code linting
- **Usage:** `npm run lint` and `npm run lint:fix`

**Prettier**

- **Purpose:** Code formatting
- **Usage:** `npm run format`

**Vitest Coverage (c8/istanbul)**

- **Purpose:** Code coverage reporting
- **Target:** 80% overall coverage minimum
- **Focus Areas:** Services, API routes, critical hooks

## 7. Test Acceptance Criteria

### 7.1 Code Coverage Targets

**Overall Coverage:** Minimum 80%

**By Category:**

- **Services:** 90% coverage
  - All public methods tested
  - Error scenarios covered
  - Edge cases validated
- **API Endpoints:** 85% coverage
  - All routes tested
  - All error codes validated
  - Authentication verified
- **React Components:** 75% coverage
  - Core components fully tested
  - User interactions verified
  - Error states validated
- **Custom Hooks:** 85% coverage
  - All state transitions tested
  - Side effects verified
- **Utilities:** 90% coverage
  - All functions tested
  - Edge cases covered

### 7.2 Test Success Criteria

**All tests must:**

- Execute without errors
- Complete within reasonable time (unit tests < 5s, E2E < 5min)
- Be deterministic (no flaky tests)
- Use proper assertions
- Clean up after execution

### 7.3 Critical Path Requirements

**The following flows must pass 100% of tests:**

1. User registration and login
2. Password reset flow
3. Flashcard generation and review
4. Protected route access control
5. Flashcard limit enforcement
6. Error handling for external API failures

### 7.4 Test Documentation

**Required Documentation:**

- All test files have descriptive test names
- Complex scenarios have explanatory comments
- Test setup and teardown documented
- Mocking strategies documented
- Known limitations documented

### 7.5 Regression Prevention

**No Regressions:**

- All existing tests continue to pass
- New features have corresponding tests
- Bug fixes include regression tests
- Test suite runs in CI/CD pipeline

## Appendix

### A. Test Naming Conventions

**Unit Tests:**

```typescript
describe('FlashcardBatchService', () => {
  describe('generateFlashcardsFromText', () => {
    it('should generate flashcards from valid text', () => { ... });
    it('should throw ValidationError for text under 1000 chars', () => { ... });
    it('should retry on OpenRouter timeout', () => { ... });
  });
});
```

**E2E Tests:**

```typescript
test("User can register, login, generate flashcards, and review them", async ({ page }) => {
  // Test implementation
});
```

### B. Useful Commands

**Run all tests:**

```bash
npm run test
```

**Run unit tests only:**

```bash
npm run test:unit
```

**Run E2E tests:**

```bash
npm run test:e2e
```

**Generate coverage report:**

```bash
npm run test:coverage
```

**Run tests in watch mode:**

```bash
npm run test:watch
```

### C. References

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Astro Testing Guide](https://docs.astro.build/en/guides/testing/)
