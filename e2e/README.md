# E2E Tests Setup Guide

This directory contains end-to-end tests for the 10x Flashcards application using Playwright.

## Prerequisites

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up test environment variables**:
   
   Create a `.env.test` file in the project root with the following variables:
   
   ```env
   # Test user credentials
   # Create a test user in your Supabase instance specifically for E2E testing
   E2E_USERNAME_ID=your-test-user-id
   E2E_USERNAME=test@example.com
   E2E_PASSWORD=Test123!@#
   
   # Supabase Configuration
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_service_role_key
   PUBLIC_SUPABASE_URL=your_supabase_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Base URL for E2E tests
   BASE_URL=http://localhost:3000
   ```

3. **Create a test user in Supabase**:
   
   You need to create a dedicated test user in your Supabase instance:
   
   - Go to your Supabase Dashboard → Authentication → Users
   - Click "Invite User" or "Add User"
   - Use the email and password from your `.env.test` file
   - Make sure the email is confirmed
   
   **Important**: Use a separate test user account, not your personal account!

## Running Tests

### Run all E2E tests
```bash
npx playwright test
```

### Run specific test file
```bash
npx playwright test e2e/flashcard-generation.spec.ts
```

### Run tests in UI mode (recommended for debugging)
```bash
npx playwright test --ui
```

### Run tests in headed mode (see the browser)
```bash
npx playwright test --headed
```

### Run tests in debug mode
```bash
npx playwright test --debug
```

### View test report
```bash
npx playwright show-report
```

## Test Structure

```
e2e/
├── README.md                      # This file
├── fixtures/
│   └── sample-text.ts            # Test data and mock API responses
├── helpers/
│   └── auth.ts                   # Authentication helpers
├── page-objects/
│   └── FlashcardGeneratorPage.ts # Page Object Model for flashcard generation
└── *.spec.ts                     # Test specifications
```

## Writing Tests

### Page Object Model (POM)

We use the Page Object Model pattern to keep tests maintainable:

```typescript
import { FlashcardGeneratorPage } from "./page-objects/FlashcardGeneratorPage";

test("example test", async ({ page }) => {
  const flashcardPage = new FlashcardGeneratorPage(page);
  
  await flashcardPage.goto();
  await flashcardPage.fillInputText("sample text");
  await flashcardPage.clickGenerate();
  
  // ... more actions
});
```

### Authentication

All tests requiring authentication should use the `loginViaAPI` helper:

```typescript
import { loginViaAPI } from "./helpers/auth";

test.beforeEach(async ({ page }) => {
  await loginViaAPI(page);
  // Now the user is authenticated
});
```

### Test Data Attributes

Components use `data-testid` attributes for reliable test selectors:

```typescript
// In component
<button data-testid="generate-button">Generate</button>

// In test
await page.getByTestId("generate-button").click();
```

## Troubleshooting

### Tests fail with "Not authenticated" error

- Make sure you've created a test user in Supabase
- Verify your `.env.test` file has the correct credentials
- Check that the test user's email is confirmed in Supabase

### Tests fail with "Connection refused"

- Make sure your development server is running: `npm run dev`
- Check that the `BASE_URL` in `.env.test` matches your dev server

### Tests are flaky

- Use proper wait conditions: `waitFor()`, `waitForURL()`, etc.
- Avoid hardcoded `timeout()` calls when possible
- Check network requests in the Playwright trace viewer

### View test traces

When tests fail, traces are automatically saved. View them with:

```bash
npx playwright show-trace test-results/<test-name>/trace.zip
```

## CI/CD Integration

The Playwright config is set up for CI environments:

- Uses 1 worker in CI for stability
- Retries tests 2 times on failure
- Generates JUnit XML reports
- Saves traces and videos on failure

## Best Practices

1. **Always use Page Object Model** for component interactions
2. **Use authentication helpers** instead of logging in manually in each test
3. **Mock API calls** where appropriate to avoid flaky external dependencies
4. **Use semantic locators** (`getByRole`, `getByLabel`) when possible
5. **Follow AAA pattern**: Arrange, Act, Assert
6. **Keep tests independent** - each test should work in isolation
7. **Use descriptive test names** that explain what is being tested
8. **Clean up after tests** if they create persistent data

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Test Generator](https://playwright.dev/docs/codegen)
- [Playwright Trace Viewer](https://playwright.dev/docs/trace-viewer)

