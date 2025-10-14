# Authentication System Technical Specification

## IMPLEMENTATION STATUS

**Phase 1: UI Components - ✅ COMPLETED**
- ✅ Registration page and form component
- ✅ Login page and form component
- ✅ Forgot password page and form component
- ✅ Reset password page and form component
- ✅ Password strength indicator component
- ✅ Auth error display component
- ✅ Validation schemas (Zod)
- ✅ Type definitions

**Phase 2: Backend Integration - 🔄 NOT STARTED**
- ⏳ Supabase SSR setup
- ⏳ Middleware authentication
- ⏳ API endpoints (logout, delete account)
- ⏳ RLS policies
- ⏳ Service layer updates
- ⏳ Settings page and components

---

## 1. OVERVIEW

### 1.1 Purpose

This specification defines the complete authentication architecture for the 10x-project flashcard application, implementing user registration, login, password recovery, and account deletion functionality using Supabase Auth integrated with Astro 5.

### 1.2 Scope

- **In Scope**: User registration (US-001), user login (US-002), password reset (US-003), account deletion (US-004)
- **Current State**: Application uses DEFAULT_USER_ID constant; no authentication implemented
- **Target State**: Full authentication with session management, protected routes, and user-specific data access

### 1.3 Key Architectural Principles

1. **Server-Side Rendering**: Leverage Astro's SSR capabilities for authentication state
2. **Session Management**: Use HTTP-only cookies for secure session storage
3. **Route Protection**: Middleware-based authentication guards
4. **Service Layer Pattern**: Follow existing unified service pattern for auth operations
5. **Progressive Enhancement**: Forms work without JavaScript, enhanced with React for UX
6. **Security First**: PKCE flow, secure cookie handling, CSRF protection

---

## 2. USER INTERFACE ARCHITECTURE

### 2.1 Page Structure

#### 2.1.1 New Authentication Pages

##### `/register` (src/pages/register.astro)

**Status**: ✅ IMPLEMENTED (UI only, backend TODO)

**Purpose**: User registration page

**Server-Side Logic** (TODO - Phase 2):

- Redirect to `/` if user is already authenticated
- Check session from cookies via middleware
- No form processing (handled by Supabase client-side)

**UI Components**:

- `<RegistrationForm>` React component (client:load)
- Form fields:
  - Email input (type="email", required)
  - Password input (type="password", required)
  - Confirm password input (type="password", required)
  - Submit button
- Character counter for password
- Real-time validation feedback
- Link to login page
- Terms of service acceptance checkbox

**Layout**: Uses `Layout.astro` without authenticated navigation

---

##### `/login` (src/pages/login.astro)

**Status**: ✅ IMPLEMENTED (UI only, backend TODO)

**Purpose**: User login page

**Server-Side Logic** (TODO - Phase 2):

- Redirect to `/` if user is already authenticated
- Handle "remember me" functionality via session configuration

**UI Components**:

- `<LoginForm>` React component (client:load)
- Form fields:
  - Email input (type="email", required)
  - Password input (type="password", required)
  - "Remember me" checkbox (configures session duration)
  - Submit button
- Link to password reset
- Link to registration page

**Layout**: Uses `Layout.astro` without authenticated navigation

---

##### `/forgot-password` (src/pages/forgot-password.astro)

**Status**: ✅ IMPLEMENTED (UI only, backend TODO)

**Purpose**: Password reset request page

**Server-Side Logic** (TODO - Phase 2):

- Available to both authenticated and unauthenticated users
- No special redirects

**UI Components**:

- `<ForgotPasswordForm>` React component (client:load)
- Form fields:
  - Email input (type="email", required)
  - Submit button
- Success message display
- Link back to login

**Layout**: Uses `Layout.astro`

---

##### `/reset-password` (src/pages/reset-password.astro)

**Status**: ✅ IMPLEMENTED (UI only, backend TODO)

**Purpose**: Password reset completion page (accessed via email link)

**Server-Side Logic** (TODO - Phase 2):

- Validate reset token from URL query parameters
- Extract token type and access token from URL hash (Supabase callback)
- If no valid token, show error and redirect to `/forgot-password`

**Current Implementation**:
- Passes placeholder `accessToken` to component
- Token extraction from URL hash needs to be implemented in Phase 2

**UI Components**:

- `<ResetPasswordForm>` React component (client:load)
- Form fields:
  - New password input (type="password", required)
  - Confirm new password input (type="password", required)
  - Submit button
- Password strength indicator
- Character counter
- Link to login after success

**Layout**: Uses `Layout.astro`

---

##### `/settings` (src/pages/settings.astro)

**Status**: ⏳ NOT IMPLEMENTED (Phase 2)

**Purpose**: Account management page

**Server-Side Logic** (TODO - Phase 2):

- **Protected route** - redirect to `/login` if not authenticated
- Load user profile from session

**UI Components**:

- `<AccountSettings>` React component (client:load)
- Sections:
  - Profile information (email, display name - read-only for MVP)
  - Account deletion section with `<DeleteAccountDialog>` component
- Danger zone clearly marked

**Layout**: Uses `Layout.astro` with authenticated navigation

---

#### 2.1.2 Modified Existing Pages

##### `/` (src/pages/index.astro) - UPDATED

**Changes**:

- Add authentication check in server-side logic
- **If authenticated**: Show "Go to Generate Flashcards" CTA and user stats
- **If not authenticated**: Show "Get Started" CTA linking to `/register`
- Display different messaging based on auth state

**Component Updates**:

- Update `<Welcome>` component to accept authentication state prop
- Add conditional rendering for auth/non-auth states

---

##### `/generate` (src/pages/generate.astro) - UPDATED

**Changes**:

- **Protected route** - redirect to `/login` if not authenticated
- No UI changes, only route protection

**Server-Side Logic**:

```typescript
// Pseudocode
const session = await Astro.locals.supabase.auth.getSession();
if (!session.data.session) {
  return Astro.redirect("/login?redirect=/generate");
}
```

---

#### 2.1.3 Layout Updates

##### `src/layouts/Layout.astro` - UPDATED

**Changes**:

- Accept optional `user` prop for authenticated user data
- Pass user data to TopBar component

**Interface Update**:

```typescript
interface Props {
  title?: string;
  user?: AuthenticatedUser | null;
}
```

---

##### `src/components/TopBar.astro` - UPDATED

**Changes**:

- Accept `user` prop
- **If authenticated**:
  - Show user email or name
  - Add "Settings" link
  - Add "Logout" button (form-based)
  - Keep existing navigation items
- **If not authenticated**:
  - Add "Login" link
  - Add "Register" button
  - Keep home link only

**Structure**:

```
[Logo] [Navigation Links] [Auth Section]
                          ↓
                   [User Menu or Login/Register]
```

---

### 2.2 React Component Architecture

#### 2.2.1 Form Components

All form components follow this pattern:

- Built using Shadcn/ui Form component (which wraps React Hook Form)
- Shadcn/ui components (Form, FormField, FormControl, FormLabel, FormMessage, Input, Button, Alert)
- Zod schema validation with zodResolver
- Form state managed by shadcn Form component (built on React Hook Form)
- Client-side validation with real-time feedback (onBlur mode)
- Server-side validation via API (Supabase client-side)
- Supabase client for authentication operations
- Error state management with FormMessage component
- Loading states during submission
- Accessibility (ARIA labels, error announcements, form context)

---

##### `<RegistrationForm>` (src/components/auth/RegistrationForm.tsx)

**Status**: ✅ IMPLEMENTED

**Location**: src/components/auth/RegistrationForm.tsx

**Implementation Notes**:
- Uses shadcn Form component (wraps React Hook Form)
- Validation with Zod + zodResolver
- Form mode: onBlur
- Backend integration (Supabase) is placeholder (TODO comments)

**Props**: None

**State Management**:

- Form state: email, password, confirmPassword, acceptTerms
- Validation state: field errors, global error
- Loading state: isSubmitting
- Success state: isRegistered

**Validation Rules** (Zod Schema):

```typescript
{
  email: z.string().email("Invalid email format"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/\d/, "Password must contain at least 1 number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least 1 special character"),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms of service"
  })
}.refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
})
```

**User Flow**:

1. User fills form with real-time validation feedback
2. On submit, validate all fields
3. Call `supabase.auth.signUp({ email, password })`
4. On success, show message: "Registration successful! Please check your email to verify your account."
5. On error, display error message (duplicate email, service unavailable, etc.)
6. Email verification required before login

**Error Messages**:

- `"This email is already registered"` - duplicate email
- `"Email format is invalid"` - validation error
- `"Password must be at least 8 characters with 1 number and 1 special character"` - validation
- `"Passwords do not match"` - confirmation mismatch
- `"Registration service is temporarily unavailable. Please try again later."` - server error

---

##### `<LoginForm>` (src/components/auth/LoginForm.tsx)

**Status**: ✅ IMPLEMENTED

**Location**: src/components/auth/LoginForm.tsx

**Implementation Notes**:
- Uses shadcn Form component
- Supports redirectTo parameter
- Backend integration (Supabase) is placeholder (TODO comments)

**Props**:

```typescript
{
  redirectTo?: string; // Optional redirect after successful login
}
```

**State Management**:

- Form state: email, password, rememberMe
- Validation state: field errors, global error
- Loading state: isSubmitting

**Validation Rules** (Zod Schema):

```typescript
{
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional()
}
```

**User Flow**:

1. User enters email and password
2. Optional: Check "Remember me" for 30-day session
3. On submit, validate fields
4. Call `supabase.auth.signInWithPassword({ email, password })`
5. Set session persistence based on rememberMe:
   - If true: persistent session (30 days)
   - If false: session cookie (browser session)
6. On success, redirect to `redirectTo` or `/generate`
7. On error, display error message

**Error Messages**:

- `"Invalid email or password"` - authentication failed
- `"Email not verified. Please check your inbox."` - unverified email
- `"Too many login attempts. Please try again later."` - rate limiting
- `"Login service is temporarily unavailable. Please try again."` - server error

---

##### `<ForgotPasswordForm>` (src/components/auth/ForgotPasswordForm.tsx)

**Status**: ✅ IMPLEMENTED

**Location**: src/components/auth/ForgotPasswordForm.tsx

**Implementation Notes**:
- Uses shadcn Form component
- Shows success state after submission
- Backend integration (Supabase) is placeholder (TODO comments)

**Props**: None

**State Management**:

- Form state: email
- Validation state: field errors
- Loading state: isSubmitting
- Success state: emailSent

**Validation Rules** (Zod Schema):

```typescript
{
  email: z.string().email("Invalid email format");
}
```

**User Flow**:

1. User enters email address
2. On submit, validate email format
3. Call `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'APP_URL/reset-password' })`
4. Always show success message (security best practice - don't reveal if email exists)
5. User receives email with reset link
6. Link expires after 24 hours

**Success Message**:

- `"If an account exists with this email, you will receive a password reset link shortly. Please check your inbox and spam folder."`

**Error Messages**:

- `"Email format is invalid"` - validation error
- `"Password reset service is temporarily unavailable. Please try again."` - server error

---

##### `<ResetPasswordForm>` (src/components/auth/ResetPasswordForm.tsx)

**Status**: ✅ IMPLEMENTED

**Location**: src/components/auth/ResetPasswordForm.tsx

**Implementation Notes**:
- Uses shadcn Form component
- Includes password strength indicator
- Auto-redirect countdown after success (3 seconds)
- Backend integration (Supabase) is placeholder (TODO comments)

**Props**:

```typescript
{
  accessToken: string; // Extracted from URL by Astro page
}
```

**State Management**:

- Form state: newPassword, confirmPassword
- Validation state: field errors, global error
- Loading state: isSubmitting
- Success state: passwordReset

**Validation Rules** (Zod Schema):

```typescript
{
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/\d/, "Password must contain at least 1 number")
    .regex(/[!@#$%^&*]/, "Password must contain at least 1 special character"),
  confirmPassword: z.string()
}.refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
})
```

**User Flow**:

1. Page validates access token from URL
2. User enters new password and confirmation
3. Real-time password strength indicator
4. On submit, validate fields
5. Call `supabase.auth.updateUser({ password: newPassword })`
6. On success, show success message and link to login
7. On error, display error message (expired token, invalid token, etc.)

**Error Messages**:

- `"Your password reset link has expired. Please request a new one."` - expired token
- `"Invalid password reset link. Please request a new one."` - invalid token
- `"Password must be at least 8 characters with 1 number and 1 special character"` - validation
- `"Passwords do not match"` - confirmation mismatch
- `"Password reset service is temporarily unavailable. Please try again."` - server error

---

##### `<DeleteAccountDialog>` (src/components/auth/DeleteAccountDialog.tsx)

**Status**: ⏳ NOT IMPLEMENTED (Phase 2)

**Location**: src/components/auth/DeleteAccountDialog.tsx (to be created)

**Props**:

```typescript
{
  userEmail: string;
}
```

**State Management**:

- Dialog state: isOpen
- Form state: confirmationPassword
- Validation state: field errors, global error
- Loading state: isDeleting

**Validation Rules** (Zod Schema):

```typescript
{
  confirmationPassword: z.string().min(1, "Password is required for confirmation");
}
```

**User Flow**:

1. User clicks "Delete Account" button in settings
2. Dialog opens with warning message
3. User must re-enter password for confirmation
4. Warning message clearly states:
   - "This action is permanent and cannot be undone"
   - "All your flashcards and data will be deleted within 24 hours"
5. User checks "I understand" checkbox
6. User clicks "Permanently Delete Account"
7. Call `/api/auth/delete-account` endpoint
8. On success, log out user and redirect to home with farewell message
9. On error, display error message

**Warning Message**:

```
"Are you sure you want to delete your account?

This action is permanent and cannot be undone. All your data will be deleted:
- All flashcards (X flashcards)
- All AI generation history
- All study sessions
- Account settings

Your data will be permanently removed within 24 hours.

To confirm, please enter your password:"
```

**Error Messages**:

- `"Incorrect password. Please try again."` - authentication failed
- `"You must check the confirmation box"` - validation
- `"Account deletion failed. Please try again or contact support."` - server error

---

#### 2.2.2 UI Helper Components

##### `<PasswordStrengthIndicator>` (src/components/auth/PasswordStrengthIndicator.tsx)

**Status**: ✅ IMPLEMENTED

**Location**: src/components/auth/PasswordStrengthIndicator.tsx

**Purpose**: Visual indicator of password strength

**Props**:

```typescript
{
  password: string;
}
```

**Display**:

- Color-coded bar (red/yellow/green)
- Text label: "Weak" / "Medium" / "Strong"
- Criteria checklist:
  - ✓ At least 8 characters
  - ✓ Contains a number
  - ✓ Contains a special character

---

##### `<AuthErrorDisplay>` (src/components/auth/AuthErrorDisplay.tsx)

**Status**: ✅ IMPLEMENTED

**Location**: src/components/auth/AuthErrorDisplay.tsx

**Purpose**: Consistent error message display with accessibility

**Props**:

```typescript
{
  error: string | null;
}
```

**Features**:

- Uses Shadcn Alert component
- Role="alert" for screen readers
- Auto-dismisses after 10 seconds
- Consistent styling across all forms

---

### 2.3 Navigation & User Experience

#### 2.3.1 Redirect Patterns

**After Registration**:

- Stay on registration page
- Show success message with email verification instructions
- Provide link to login page

**After Login**:

- If `?redirect=` query param exists → redirect to that URL
- Else → redirect to `/generate`

**After Password Reset**:

- Show success message
- Provide link to login page
- Auto-redirect to login after 3 seconds

**After Account Deletion**:

- Log out user
- Redirect to `/` with toast message: "Your account has been deleted. We're sorry to see you go."

**Protected Route Access** (when not authenticated):

- Redirect to `/login?redirect={current_path}`
- After successful login, redirect back to originally requested page

---

#### 2.3.2 Session State Display

**Authenticated State Indicators**:

- TopBar shows user email/name
- TopBar shows "Logout" button
- Dashboard shows user-specific stats
- Protected pages accessible

**Unauthenticated State Indicators**:

- TopBar shows "Login" and "Register" links
- Homepage shows "Get Started" CTA
- Protected pages redirect to login

---

### 2.4 Validation Strategy

#### 2.4.1 Client-Side Validation

- **Trigger**: Real-time on input blur and on submit
- **Library**: Zod schemas + React Hook Form
- **Feedback**: Inline error messages below fields
- **UX**: Non-blocking, provides immediate feedback

#### 2.4.2 Server-Side Validation

- **Trigger**: On form submission to Supabase
- **Purpose**: Security, business logic enforcement
- **Error Handling**: Translate Supabase errors to user-friendly messages
- **Examples**:
  - Duplicate email detection
  - Rate limiting enforcement
  - Token validation

#### 2.4.3 Error Message Hierarchy

1. **Field-level errors**: Shown inline below input (red text)
2. **Form-level errors**: Shown at top of form (Alert component)
3. **Global errors**: Shown as toast notifications (future enhancement)

---

## 3. BACKEND ARCHITECTURE

### 3.1 Authentication Flow with Supabase

#### 3.1.1 Supabase Auth Configuration

**Auth Provider**: Supabase Auth (built-in)

**Authentication Methods**:

- Email/Password (primary)
- Magic Link (future enhancement)

**Session Management**:

- **Storage**: HTTP-only cookies via Supabase SSR package
- **Duration**:
  - Default: Session cookie (expires when browser closes)
  - With "Remember me": 30 days
- **Refresh**: Automatic token refresh handled by Supabase client

**Email Configuration**:

- **Email Verification**: Required on registration
- **Password Reset**: 24-hour expiry on reset links
- **Email Provider**: Supabase built-in (configure SMTP in Supabase dashboard)

---

#### 3.1.2 Supabase Client Setup

**Current Implementation** (src/db/supabase.client.ts):

```typescript
// ❌ CURRENT - Browser client only
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
export const DEFAULT_USER_ID = "..."; // TO BE REMOVED
```

**New Implementation** - Two Clients:

##### Browser Client (src/db/supabase.client.ts)

```typescript
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

export function createClient() {
  return createBrowserClient<Database>(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.PUBLIC_SUPABASE_ANON_KEY);
}

export type SupabaseClient = ReturnType<typeof createClient>;
```

##### Server Client (src/db/supabase.server.ts) - NEW FILE

```typescript
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { AstroCookies } from "astro";
import type { Database } from "./database.types";

export function createServerSupabaseClient(cookies: AstroCookies) {
  return createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_ANON_KEY, {
    cookies: {
      get(key: string) {
        return cookies.get(key)?.value;
      },
      set(key: string, value: string, options: CookieOptions) {
        cookies.set(key, value, options);
      },
      remove(key: string, options: CookieOptions) {
        cookies.delete(key, options);
      },
    },
  });
}

export type SupabaseServerClient = ReturnType<typeof createServerSupabaseClient>;
```

---

### 3.2 Middleware Architecture

#### 3.2.1 Authentication Middleware

**File**: src/middleware/index.ts

**Current Implementation**:

```typescript
// ❌ CURRENT
export const onRequest = defineMiddleware((context, next) => {
  context.locals.supabase = supabaseClient;
  return next();
});
```

**New Implementation**:

```typescript
import { defineMiddleware } from "astro:middleware";
import { createServerSupabaseClient } from "../db/supabase.server";

export const onRequest = defineMiddleware(async (context, next) => {
  // Create Supabase client with cookie handling
  const supabase = createServerSupabaseClient(context.cookies);

  // Attach to context
  context.locals.supabase = supabase;

  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession();
  context.locals.session = session;
  context.locals.user = session?.user ?? null;

  // Refresh session if needed (handled automatically by Supabase)

  return next();
});
```

**Context Locals Type** (src/types/env.d.ts or src/middleware/types.ts):

```typescript
import type { SupabaseServerClient } from "@/db/supabase.server";
import type { Session, User } from "@supabase/supabase-js";

declare namespace App {
  interface Locals {
    supabase: SupabaseServerClient;
    session: Session | null;
    user: User | null;
  }
}
```

---

#### 3.2.2 Route Protection Pattern

**Implementation in Protected Pages**:

```typescript
// Example: src/pages/generate.astro
---
const { user } = Astro.locals;

if (!user) {
  // Store intended destination
  const redirectUrl = encodeURIComponent(Astro.url.pathname);
  return Astro.redirect(`/login?redirect=${redirectUrl}`);
}

// User is authenticated, proceed with page logic
---
```

**Protected Routes List**:

- `/generate` - Flashcard generation page
- `/settings` - Account settings page
- All future dashboard and study pages

**Public Routes List**:

- `/` - Homepage (personalized based on auth state)
- `/register` - Registration page
- `/login` - Login page
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset completion

---

### 3.3 API Endpoints

#### 3.3.1 Logout Endpoint

**Route**: POST /api/auth/logout

**File**: src/pages/api/auth/logout.ts

**Purpose**: Server-side logout to clear session cookies

**Implementation**:

```typescript
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ locals, cookies, redirect }) => {
  const { supabase } = locals;

  // Sign out from Supabase
  await supabase.auth.signOut();

  // Cookies are automatically cleared by Supabase client

  // Redirect to homepage
  return redirect("/");
};
```

**Usage**: Called from TopBar logout button (form submission)

**Response**:

- Success: Redirect to `/`
- Error: Return JSON error (unlikely, logout is best-effort)

---

#### 3.3.2 Account Deletion Endpoint

**Route**: POST /api/auth/delete-account

**File**: src/pages/api/auth/delete-account.ts

**Purpose**: Delete user account and all associated data

**Authentication**: Required (user must be logged in)

**Request Body** (JSON):

```typescript
{
  confirmationPassword: string;
}
```

**Request Validation** (Zod Schema):

```typescript
import { z } from "zod";

const DeleteAccountSchema = z.object({
  confirmationPassword: z.string().min(1, "Password is required"),
});
```

**Implementation Pseudocode**:

```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  const { supabase, user } = locals;

  // 1. Check authentication
  if (!user) {
    return new Response(
      JSON.stringify({
        error: "unauthorized",
        message: "You must be logged in to delete your account",
      }),
      { status: 401 }
    );
  }

  // 2. Parse and validate request body
  const body = await request.json();
  const validation = DeleteAccountSchema.safeParse(body);

  if (!validation.success) {
    return new Response(
      JSON.stringify({
        error: "validation_error",
        message: "Invalid request data",
        details: validation.error.issues,
      }),
      { status: 400 }
    );
  }

  const { confirmationPassword } = validation.data;

  // 3. Re-authenticate user with password
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: confirmationPassword,
  });

  if (authError) {
    return new Response(
      JSON.stringify({
        error: "authentication_failed",
        message: "Incorrect password",
      }),
      { status: 401 }
    );
  }

  // 4. Delete user data (handled by database CASCADE constraints)
  //    Order matters due to foreign key constraints:
  //    - Flashcards reference ai_generation_batches
  //    - Both flashcards and ai_generation_batches reference user_id

  // 5. Delete user account from Supabase Auth
  const { error: deleteError } = await supabase.rpc("delete_user");

  if (deleteError) {
    return new Response(
      JSON.stringify({
        error: "deletion_failed",
        message: "Failed to delete account. Please try again or contact support.",
      }),
      { status: 500 }
    );
  }

  // 6. Sign out (clears session)
  await supabase.auth.signOut();

  // 7. Return success
  return new Response(
    JSON.stringify({
      success: true,
      message: "Account deleted successfully",
    }),
    { status: 200 }
  );
};
```

**Database Deletion Strategy**:

Option A: Database CASCADE constraints (RECOMMENDED)

- Configure foreign key constraints with ON DELETE CASCADE
- When user is deleted from auth.users, Supabase automatically deletes related rows
- Tables to cascade: flashcards, ai_generation_batches, study_sessions

Option B: Manual deletion in endpoint

- Explicitly delete from each table before deleting user
- More control but more error-prone

**Response Codes**:

- `200 OK`: Account deleted successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Not logged in or incorrect password
- `500 Internal Server Error`: Deletion failed

**Error Messages**:

```typescript
{
  "error": "authentication_failed",
  "message": "Incorrect password"
}

{
  "error": "deletion_failed",
  "message": "Failed to delete account. Please try again or contact support."
}
```

---

#### 3.3.3 Update Existing API Endpoints

**Affected Endpoints**:

- POST /api/flashcards/batch
- POST /api/flashcards/batch/[batchId]/review
- All future flashcard CRUD endpoints

**Required Changes**:

1. **Remove DEFAULT_USER_ID**:

   ```typescript
   // ❌ BEFORE
   import { DEFAULT_USER_ID } from "@/db/supabase.client";
   // ... use DEFAULT_USER_ID

   // ✅ AFTER
   const { user } = locals;
   if (!user) {
     return new Response(
       JSON.stringify({
         error: "unauthorized",
         message: "You must be logged in",
       }),
       { status: 401 }
     );
   }
   const userId = user.id;
   ```

2. **Authentication Check Pattern**:

   ```typescript
   export const POST: APIRoute = async ({ request, locals }) => {
     // First thing: check authentication
     const { user, supabase } = locals;

     if (!user) {
       return new Response(
         JSON.stringify({
           error: "unauthorized",
           message: "Authentication required",
         }),
         { status: 401 }
       );
     }

     // Continue with endpoint logic
     // Use user.id instead of DEFAULT_USER_ID
   };
   ```

3. **Service Layer Updates**:
   - Pass `userId` from endpoint to service methods
   - Remove DEFAULT_USER_ID imports from services
   - Update service method signatures to accept userId parameter

---

### 3.4 Database Considerations

#### 3.4.1 User Management

**Supabase Auth Schema**:

- Supabase manages `auth.users` table automatically
- User ID (UUID) is primary key
- Email, password hash, metadata stored in auth schema
- Application references `auth.users.id` via foreign keys

**User Metadata** (stored in auth.users.raw_user_meta_data):

- Currently: None (MVP)
- Future: Display name, avatar URL, preferences

---

#### 3.4.2 Row Level Security (RLS) Policies

**Purpose**: Database-level security to ensure users can only access their own data

**Required Policies**:

##### Flashcards Table

```sql
-- Enable RLS
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- SELECT policy: Users can only read their own flashcards
CREATE POLICY "Users can read own flashcards"
  ON flashcards FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT policy: Users can only create flashcards for themselves
CREATE POLICY "Users can insert own flashcards"
  ON flashcards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE policy: Users can only update their own flashcards
CREATE POLICY "Users can update own flashcards"
  ON flashcards FOR UPDATE
  USING (auth.uid() = user_id);

-- DELETE policy: Users can only delete their own flashcards
CREATE POLICY "Users can delete own flashcards"
  ON flashcards FOR DELETE
  USING (auth.uid() = user_id);
```

##### AI Generation Batches Table

```sql
-- Enable RLS
ALTER TABLE ai_generation_batches ENABLE ROW LEVEL SECURITY;

-- SELECT policy
CREATE POLICY "Users can read own batches"
  ON ai_generation_batches FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT policy
CREATE POLICY "Users can insert own batches"
  ON ai_generation_batches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE policy
CREATE POLICY "Users can update own batches"
  ON ai_generation_batches FOR UPDATE
  USING (auth.uid() = user_id);

-- DELETE policy
CREATE POLICY "Users can delete own batches"
  ON ai_generation_batches FOR DELETE
  USING (auth.uid() = user_id);
```

##### Study Sessions Table

```sql
-- Enable RLS
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- SELECT policy
CREATE POLICY "Users can read own sessions"
  ON study_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT policy
CREATE POLICY "Users can insert own sessions"
  ON study_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE policy
CREATE POLICY "Users can update own sessions"
  ON study_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- DELETE policy
CREATE POLICY "Users can delete own sessions"
  ON study_sessions FOR DELETE
  USING (auth.uid() = user_id);
```

**Benefits**:

- Defense in depth: Even if application logic fails, database enforces security
- Prevents unauthorized data access via direct database queries
- Automatically enforced by Supabase client

---

#### 3.4.3 Account Deletion Data Cleanup

**Strategy**: Cascade delete via foreign key constraints

**Required Foreign Key Updates**:

```sql
-- Update flashcards foreign key to cascade on user deletion
ALTER TABLE flashcards
  DROP CONSTRAINT IF EXISTS flashcards_user_id_fkey,
  ADD CONSTRAINT flashcards_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- Update ai_generation_batches foreign key
ALTER TABLE ai_generation_batches
  DROP CONSTRAINT IF EXISTS ai_generation_batches_user_id_fkey,
  ADD CONSTRAINT ai_generation_batches_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- Update study_sessions foreign key
ALTER TABLE study_sessions
  DROP CONSTRAINT IF EXISTS study_sessions_user_id_fkey,
  ADD CONSTRAINT study_sessions_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;
```

**Deletion Flow**:

1. User confirms account deletion in UI
2. API endpoint re-authenticates user with password
3. API calls Supabase admin method to delete user
4. Supabase deletes user from auth.users table
5. Database automatically deletes all related data via CASCADE
6. API signs out user and redirects to homepage

**Alternative: Soft Delete** (Not Recommended for MVP):

- Add `deleted_at` timestamp to auth.users metadata
- Hide user data instead of deleting
- Retain data for potential recovery
- More complex implementation

---

### 3.5 Environment Variables

**Current** (.env.example):

```
SUPABASE_URL=###
SUPABASE_KEY=###
OPENROUTER_API_KEY=###
```

**Updated** (.env.example):

```
# Supabase Configuration
SUPABASE_URL=###
SUPABASE_ANON_KEY=###

# Public Supabase Configuration (exposed to browser)
PUBLIC_SUPABASE_URL=###
PUBLIC_SUPABASE_ANON_KEY=###

# OpenRouter API Key
OPENROUTER_API_KEY=###

# Application URL (for email links)
PUBLIC_APP_URL=http://localhost:3000
```

**Usage**:

- `SUPABASE_URL` / `PUBLIC_SUPABASE_URL`: Same value, different exposure
- `SUPABASE_ANON_KEY` / `PUBLIC_SUPABASE_ANON_KEY`: Same value, different exposure
- `PUBLIC_APP_URL`: Used for password reset redirect URLs

**Security Notes**:

- Anon key is safe to expose (protected by RLS policies)
- Never expose service role key in frontend
- Use `PUBLIC_` prefix for Astro to include in client bundle

---

## 4. AUTHENTICATION SYSTEM INTEGRATION

### 4.1 Supabase Auth Flow

#### 4.1.1 Registration Flow

**Step-by-Step**:

1. User fills registration form on `/register`
2. Client-side validation (Zod schema)
3. React component calls `supabase.auth.signUp({ email, password })`
4. Supabase creates user in `auth.users` table (status: unconfirmed)
5. Supabase sends verification email
6. UI shows success message: "Please check your email to verify your account"
7. User clicks link in email
8. Supabase verifies email and updates user status to confirmed
9. User is redirected to login page

**Configuration** (Supabase Dashboard):

- Enable email confirmation requirement
- Configure email templates
- Set redirect URL for email confirmation: `PUBLIC_APP_URL/login?verified=true`

**Email Template Variables**:

- `{{ .ConfirmationURL }}` - Verification link
- `{{ .Email }}` - User's email
- `{{ .SiteURL }}` - Application URL

---

#### 4.1.2 Login Flow

**Step-by-Step**:

1. User fills login form on `/login`
2. Client-side validation (Zod schema)
3. React component calls `supabase.auth.signInWithPassword({ email, password })`
4. Supabase validates credentials
5. If valid and email verified:
   - Supabase creates session
   - Session stored in cookies (HTTP-only, Secure, SameSite)
   - React triggers navigation to redirect URL or `/generate`
6. If email not verified:
   - Show error: "Please verify your email before logging in"
   - Provide "Resend verification email" link
7. If credentials invalid:
   - Show error: "Invalid email or password"

**Session Storage**:

- Cookie name: `sb-{project-ref}-auth-token`
- HTTP-only: Yes (XSS protection)
- Secure: Yes (HTTPS only in production)
- SameSite: Lax (CSRF protection)
- Duration: 30 days if "remember me", otherwise session cookie

---

#### 4.1.3 Password Reset Flow

**Step-by-Step**:

1. User navigates to `/forgot-password`
2. User enters email address
3. React component calls `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
4. Supabase sends password reset email (always succeeds to prevent email enumeration)
5. UI shows success message
6. User clicks link in email
7. Supabase redirects to `/reset-password` with token in URL hash
8. Astro page extracts token from URL and passes to React component
9. User enters new password
10. React component calls `supabase.auth.updateUser({ password: newPassword })`
11. Supabase updates password
12. UI shows success message and redirects to login

**Token Format** (URL hash):

```
/reset-password#access_token=xxx&refresh_token=yyy&type=recovery
```

**Token Extraction** (Astro page):

```typescript
---
// src/pages/reset-password.astro
const hash = Astro.url.hash
const params = new URLSearchParams(hash.slice(1))
const accessToken = params.get('access_token')
const type = params.get('type')

if (!accessToken || type !== 'recovery') {
  return Astro.redirect('/forgot-password?error=invalid_token')
}
---

<ResetPasswordForm client:load accessToken={accessToken} />
```

---

#### 4.1.4 Logout Flow

**Step-by-Step**:

1. User clicks logout button in TopBar
2. Form submits to POST /api/auth/logout
3. API endpoint calls `supabase.auth.signOut()`
4. Supabase clears session cookies
5. API redirects to homepage
6. Middleware detects no session on next request
7. UI shows unauthenticated state

**Implementation** (TopBar):

```typescript
<form method="POST" action="/api/auth/logout">
  <button type="submit">Logout</button>
</form>
```

---

#### 4.1.5 Session Refresh Flow

**Automatic Refresh**:

- Supabase client automatically refreshes tokens before expiry
- Refresh happens in background
- No user interaction required
- Handled by `@supabase/ssr` package

**Manual Refresh** (if needed):

```typescript
const { data, error } = await supabase.auth.refreshSession();
```

**Refresh Token Storage**:

- Stored in same cookie as access token
- HTTP-only, Secure, SameSite
- Used by Supabase client to obtain new access token

---

### 4.2 Session Management

#### 4.2.1 Cookie Configuration

**Cookie Strategy**:

- Supabase SSR package manages cookies automatically
- Server client reads cookies on each request
- Browser client syncs cookies with server

**Cookie Attributes**:

```typescript
{
  httpOnly: true,        // No JavaScript access (XSS protection)
  secure: true,          // HTTPS only (production)
  sameSite: 'lax',       // CSRF protection
  path: '/',             // Available site-wide
  maxAge: 30 * 24 * 60 * 60  // 30 days if "remember me"
}
```

**Cookie Names**:

- `sb-{project-ref}-auth-token` - Access token
- `sb-{project-ref}-auth-token-code-verifier` - PKCE verifier

---

#### 4.2.2 Session Validation

**On Every Request** (Middleware):

```typescript
// Middleware validates session on every request
const {
  data: { session },
} = await supabase.auth.getSession();

// Session contains:
// - user: User object (id, email, etc.)
// - access_token: JWT token
// - refresh_token: For token refresh
// - expires_at: Expiration timestamp
```

**Expired Session Handling**:

- Middleware attempts to refresh session automatically
- If refresh fails, session is null
- User must login again

---

#### 4.2.3 User Context Access

**In Astro Pages** (Server-side):

```typescript
---
const { user, session } = Astro.locals

if (!user) {
  return Astro.redirect('/login')
}

// Access user properties:
// - user.id (UUID)
// - user.email
// - user.created_at
// - user.user_metadata
---
```

**In React Components** (Client-side):

```typescript
import { createClient } from "@/db/supabase.client";

function MyComponent() {
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      // user contains same properties as server-side
    }
    getUser();
  }, []);
}
```

**In API Endpoints**:

```typescript
export const POST: APIRoute = async ({ locals }) => {
  const { user, supabase } = locals;

  if (!user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
    });
  }

  // Use user.id for database queries
};
```

---

### 4.3 Security Considerations

#### 4.3.1 CSRF Protection

**Strategy**: SameSite cookies + Origin checking

**Implementation**:

- Cookies set with `sameSite: 'lax'`
- Prevents cross-site cookie sending on POST requests
- Origin header checked on sensitive endpoints (future enhancement)

**Form-Based Logout**:

- Logout uses POST request (not GET)
- Prevents CSRF logout attacks
- Form submission inherently safe with SameSite cookies

---

#### 4.3.2 XSS Protection

**Strategies**:

1. **HTTP-only cookies**: Session tokens not accessible to JavaScript
2. **Content Security Policy** (future enhancement):
   ```typescript
   // In Astro config or middleware
   response.headers.set("Content-Security-Policy", "default-src 'self'");
   ```
3. **Input sanitization**: Zod validation on all inputs
4. **Output encoding**: React automatically escapes JSX content

---

#### 4.3.3 Password Security

**Supabase Handles**:

- Password hashing (bcrypt)
- Salt generation
- Hash comparison
- Never store plaintext passwords

**Application Enforces**:

- Password complexity requirements (8 chars, 1 number, 1 special char)
- Password confirmation on registration
- Password re-entry on account deletion

**Best Practices**:

- Never log passwords
- Never send passwords in GET requests
- Never include passwords in error messages
- Clear password fields on error

---

#### 4.3.4 Rate Limiting

**Supabase Built-in**:

- Login attempts: Configurable in Supabase dashboard
- Password reset requests: Configurable
- Registration: Configurable

**Application-Level** (future enhancement):

- Add rate limiting middleware for sensitive endpoints
- Use Supabase Edge Functions or external service (Upstash, etc.)

---

#### 4.3.5 Email Verification

**Requirement**: Mandatory for MVP

**Implementation**:

- Configure in Supabase dashboard: Authentication > Email Auth > "Enable email confirmations"
- Unverified users cannot login
- Verification link expires after 24 hours (configurable)

**User Experience**:

- Clear messaging about email verification requirement
- "Resend verification email" option on login page
- Link in email redirects to login with success message

---

## 5. TYPE DEFINITIONS

### 5.1 Authentication Types

**File**: src/types/auth.ts (NEW FILE)

```typescript
import type { User, Session } from "@supabase/supabase-js";

/**
 * Authenticated user type (alias for Supabase User)
 */
export type AuthenticatedUser = User;

/**
 * User session type (alias for Supabase Session)
 */
export type AuthSession = Session;

/**
 * Login form data
 */
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Registration form data
 */
export interface RegistrationFormData {
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

/**
 * Forgot password form data
 */
export interface ForgotPasswordFormData {
  email: string;
}

/**
 * Reset password form data
 */
export interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

/**
 * Delete account form data
 */
export interface DeleteAccountFormData {
  confirmationPassword: string;
}

/**
 * Authentication error response
 */
export interface AuthErrorResponse {
  error: string;
  message: string;
}

/**
 * Authentication success response
 */
export interface AuthSuccessResponse {
  success: true;
  message: string;
}
```

---

### 5.2 Updated Application Types

**File**: src/types.ts (UPDATE EXISTING)

Add to existing file:

```typescript
// ============================================================================
// Authentication Types
// ============================================================================

import type { AuthenticatedUser } from "./types/auth";

/**
 * API error response structure (UPDATE EXISTING)
 * Add 'unauthorized' to error codes
 */
export interface ApiError {
  error: "unauthorized" | "validation_error" | "not_found" | "rate_limit" | string;
  message: string;
  details?: {
    field: string;
    message: string;
  }[];
}
```

---

### 5.3 Astro Context Types

**File**: src/env.d.ts (UPDATE OR CREATE)

```typescript
/// <reference types="astro/client" />

import type { SupabaseServerClient } from "./db/supabase.server";
import type { Session, User } from "@supabase/supabase-js";

declare namespace App {
  interface Locals {
    supabase: SupabaseServerClient;
    session: Session | null;
    user: User | null;
  }
}

interface ImportMetaEnv {
  // Server-side only
  readonly SUPABASE_URL: string;
  readonly SUPABASE_ANON_KEY: string;
  readonly OPENROUTER_API_KEY: string;

  // Public (exposed to browser)
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly PUBLIC_APP_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

---

## 6. SERVICE LAYER ARCHITECTURE

### 6.1 Authentication Service

**File**: src/lib/auth.service.ts (NEW FILE)

**Purpose**: Centralize authentication business logic

**Class Structure**:

```typescript
import type { SupabaseClient } from "@/db/supabase.client";
import type { AuthenticatedUser } from "@/types/auth";

export class AuthService {
  private readonly supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AuthenticatedUser | null> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    return user;
  }

  /**
   * Check if user's email is verified
   */
  async isEmailVerified(userId: string): Promise<boolean> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    return user?.email_confirmed_at !== null;
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<void> {
    await this.supabase.auth.resend({
      type: "signup",
      email,
    });
  }

  /**
   * Get user statistics for dashboard
   */
  async getUserStats(userId: string): Promise<{
    totalFlashcards: number;
    totalBatches: number;
    accountCreated: string;
  }> {
    // Query database for user stats
    const [flashcardsResult, batchesResult, userResult] = await Promise.all([
      this.supabase.from("flashcards").select("*", { count: "exact", head: true }).eq("user_id", userId),
      this.supabase.from("ai_generation_batches").select("*", { count: "exact", head: true }).eq("user_id", userId),
      this.supabase.auth.getUser(),
    ]);

    return {
      totalFlashcards: flashcardsResult.count ?? 0,
      totalBatches: batchesResult.count ?? 0,
      accountCreated: userResult.data.user?.created_at ?? "",
    };
  }
}
```

**Usage in API Endpoints**:

```typescript
export const GET: APIRoute = async ({ locals }) => {
  const { user, supabase } = locals;

  if (!user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
    });
  }

  const authService = new AuthService(supabase);
  const stats = await authService.getUserStats(user.id);

  return new Response(JSON.stringify(stats), { status: 200 });
};
```

---

### 6.2 Service Updates for Authentication

#### 6.2.1 FlashcardBatchService Updates

**File**: src/lib/flashcardBatch.service.ts (UPDATE EXISTING)

**Changes**:

1. Remove DEFAULT_USER_ID import
2. Add userId parameter to all methods that currently use DEFAULT_USER_ID
3. Update method signatures

**Example**:

```typescript
// ❌ BEFORE
async getUserFlashcardCount(): Promise<number> {
  const { count } = await this.supabase
    .from('flashcards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', DEFAULT_USER_ID)

  return count ?? 0
}

// ✅ AFTER
async getUserFlashcardCount(userId: string): Promise<number> {
  const { count } = await this.supabase
    .from('flashcards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  return count ?? 0
}
```

---

## 7. ERROR HANDLING

### 7.1 Authentication Errors

**Supabase Error Codes**:

- `invalid_credentials` → "Invalid email or password"
- `email_not_confirmed` → "Please verify your email before logging in"
- `user_already_registered` → "This email is already registered"
- `over_email_send_rate_limit` → "Too many requests. Please try again later."
- `invalid_grant` → "Your session has expired. Please login again."

**Error Mapping Function**:

**File**: src/lib/auth.errors.ts (NEW FILE)

```typescript
import { AuthError } from "@supabase/supabase-js";

export function mapAuthError(error: AuthError | Error): string {
  if (error instanceof AuthError) {
    switch (error.code) {
      case "invalid_credentials":
        return "Invalid email or password";
      case "email_not_confirmed":
        return "Please verify your email before logging in";
      case "user_already_registered":
        return "This email is already registered";
      case "over_email_send_rate_limit":
        return "Too many requests. Please try again later.";
      case "invalid_grant":
        return "Your session has expired. Please login again.";
      default:
        return "An authentication error occurred. Please try again.";
    }
  }

  return "An unexpected error occurred. Please try again.";
}
```

---

### 7.2 Validation Errors

**Zod Schemas** (used in React components):

**File**: src/lib/auth.schemas.ts (NEW FILE)

```typescript
import { z } from "zod";

export const RegistrationSchema = z
  .object({
    email: z.string().email("Invalid email format"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/\d/, "Password must contain at least 1 number")
      .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least 1 special character"),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms of service",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const ResetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/\d/, "Password must contain at least 1 number")
      .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least 1 special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const DeleteAccountSchema = z.object({
  confirmationPassword: z.string().min(1, "Password is required"),
});
```

---

## 8. TESTING SCENARIOS

### 8.1 Registration Scenarios

| Scenario             | Input                                        | Expected Result                                  |
| -------------------- | -------------------------------------------- | ------------------------------------------------ |
| Valid registration   | Valid email, strong password, terms accepted | Success message, verification email sent         |
| Duplicate email      | Existing email                               | Error: "This email is already registered"        |
| Weak password        | Password without number                      | Error: "Password must contain at least 1 number" |
| Password mismatch    | Different passwords                          | Error: "Passwords do not match"                  |
| Terms not accepted   | Checkbox unchecked                           | Error: "You must accept the terms"               |
| Invalid email format | "notanemail"                                 | Error: "Invalid email format"                    |

---

### 8.2 Login Scenarios

| Scenario              | Input                                 | Expected Result                       |
| --------------------- | ------------------------------------- | ------------------------------------- |
| Valid login           | Correct email and password            | Redirect to `/generate`               |
| Invalid credentials   | Wrong password                        | Error: "Invalid email or password"    |
| Unverified email      | Valid credentials, email not verified | Error: "Please verify your email"     |
| Remember me checked   | Valid credentials, remember me        | Session lasts 30 days                 |
| Remember me unchecked | Valid credentials, no remember me     | Session lasts until browser close     |
| Redirect after login  | Accessed protected route              | Redirect to originally requested page |

---

### 8.3 Password Reset Scenarios

| Scenario             | Input                         | Expected Result                                             |
| -------------------- | ----------------------------- | ----------------------------------------------------------- |
| Valid email          | Registered email              | Success message, reset email sent                           |
| Unregistered email   | Non-existent email            | Success message (no reveal)                                 |
| Invalid email format | "notanemail"                  | Error: "Invalid email format"                               |
| Expired reset link   | Token older than 24h          | Error: "Your password reset link has expired"               |
| Valid reset          | New strong password           | Success, redirect to login                                  |
| Weak new password    | Password without special char | Error: "Password must contain at least 1 special character" |

---

### 8.4 Account Deletion Scenarios

| Scenario                 | Input                                  | Expected Result                              |
| ------------------------ | -------------------------------------- | -------------------------------------------- |
| Valid deletion           | Correct password, confirmation checked | Account deleted, logout, redirect home       |
| Incorrect password       | Wrong password                         | Error: "Incorrect password"                  |
| No confirmation checkbox | Password correct, no checkbox          | Error: "You must check the confirmation box" |
| Not authenticated        | Access settings page                   | Redirect to login                            |

---

## 9. MIGRATION PATH

### 9.1 Implementation Order

**Phase 1: Foundation** (Priority 1)

1. Install Supabase SSR package: `npm install @supabase/ssr`
2. Create server Supabase client (src/db/supabase.server.ts)
3. Update browser Supabase client (src/db/supabase.client.ts)
4. Update middleware for session management (src/middleware/index.ts)
5. Update Astro context types (src/env.d.ts)
6. Create auth types (src/types/auth.ts)
7. Create auth error mapping (src/lib/auth.errors.ts)
8. Create auth validation schemas (src/lib/auth.schemas.ts)

**Phase 2: Database Security** (Priority 1)

1. Enable Row Level Security on all tables
2. Create RLS policies for flashcards table
3. Create RLS policies for ai_generation_batches table
4. Create RLS policies for study_sessions table
5. Update foreign key constraints for CASCADE delete
6. Test RLS policies with SQL queries

**Phase 3: Authentication Pages** (Priority 2)

1. Create registration page (src/pages/register.astro)
2. Create RegistrationForm component (src/components/auth/RegistrationForm.tsx)
3. Create login page (src/pages/login.astro)
4. Create LoginForm component (src/components/auth/LoginForm.tsx)
5. Create forgot-password page (src/pages/forgot-password.astro)
6. Create ForgotPasswordForm component (src/components/auth/ForgotPasswordForm.tsx)
7. Create reset-password page (src/pages/reset-password.astro)
8. Create ResetPasswordForm component (src/components/auth/ResetPasswordForm.tsx)

**Phase 4: Account Management** (Priority 2)

1. Create settings page (src/pages/settings.astro)
2. Create AccountSettings component (src/components/auth/AccountSettings.tsx)
3. Create DeleteAccountDialog component (src/components/auth/DeleteAccountDialog.tsx)
4. Create logout endpoint (src/pages/api/auth/logout.ts)
5. Create delete account endpoint (src/pages/api/auth/delete-account.ts)

**Phase 5: UI Integration** (Priority 2)

1. Update TopBar component for auth state
2. Update Layout for user prop
3. Update homepage for auth state
4. Add route protection to /generate page
5. Add route protection to /settings page

**Phase 6: Service Updates** (Priority 3)

1. Remove DEFAULT_USER_ID from supabase.client.ts
2. Update FlashcardBatchService to accept userId
3. Update all API endpoints to use authenticated user ID
4. Create AuthService (src/lib/auth.service.ts)
5. Test all existing functionality with real user IDs

**Phase 7: Helper Components** (Priority 3)

1. Create PasswordStrengthIndicator component
2. Create AuthErrorDisplay component
3. Add loading states to all forms
4. Add success animations
5. Polish UX

**Phase 8: Configuration** (Priority 3)

1. Configure Supabase Auth settings in dashboard
2. Customize email templates
3. Set up SMTP provider (or use Supabase default)
4. Configure rate limiting
5. Set redirect URLs
6. Update environment variables

**Phase 9: Testing** (Priority 4)

1. Test registration flow
2. Test login flow
3. Test password reset flow
4. Test account deletion flow
5. Test protected routes
6. Test RLS policies
7. Test error scenarios
8. Test edge cases

---

### 9.2 Breaking Changes

**For Existing Users**:

- Current implementation uses DEFAULT_USER_ID
- No real users exist yet
- **Migration**: No data migration needed, can reset database

**For Existing Code**:

1. **DEFAULT_USER_ID removal**: All code using this constant must be updated
2. **API endpoint signatures**: All endpoints now require authentication
3. **Service method signatures**: Methods now accept userId parameter
4. **Middleware changes**: Context.locals structure updated

**Compatibility Checklist**:

- [ ] Remove all DEFAULT_USER_ID imports
- [ ] Update all service method calls to pass userId
- [ ] Add authentication checks to all API endpoints
- [ ] Update all pages to handle auth state
- [ ] Test all existing features with authenticated users

---

### 9.3 Rollback Plan

**If Authentication Implementation Fails**:

1. **Keep DEFAULT_USER_ID temporarily**:
   - Add both old and new authentication code
   - Use feature flag to switch between them

2. **Feature Flag Approach**:

   ```typescript
   const USE_AUTH = import.meta.env.FEATURE_AUTH === "true";

   const userId = USE_AUTH ? Astro.locals.user?.id || null : DEFAULT_USER_ID;
   ```

3. **Rollback Steps**:
   - Set `FEATURE_AUTH=false` in environment
   - Revert middleware changes
   - Revert API endpoint changes
   - Keep new pages but mark as "Coming Soon"

---

## 10. DEPENDENCIES

### 10.1 Required Packages

**New Dependencies**:

```json
{
  "@supabase/ssr": "^0.5.2",
  "react-hook-form": "^7.54.2",
  "@hookform/resolvers": "^3.9.1"
}
```

**Installation Command**:

```bash
npm install @supabase/ssr react-hook-form @hookform/resolvers
```

**Existing Dependencies** (no changes):

- `@supabase/supabase-js` - Already installed
- `zod` - Already installed
- `react` - Already installed
- Shadcn/ui components - Already installed

---

### 10.2 Configuration Files

**astro.config.mjs** (no changes needed):

- Already configured for SSR
- Already using Node adapter
- Server-side authentication works with current config

**tsconfig.json** (verify paths):

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 11. SECURITY CHECKLIST

### 11.1 Pre-Launch Security Review

- [ ] RLS policies enabled on all tables
- [ ] RLS policies tested with multiple users
- [ ] HTTP-only cookies enabled
- [ ] Secure cookie flag enabled in production
- [ ] SameSite cookie attribute set to 'lax'
- [ ] HTTPS enforced in production
- [ ] Email verification required
- [ ] Password complexity requirements enforced
- [ ] Rate limiting configured in Supabase
- [ ] CSRF protection via SameSite cookies
- [ ] No sensitive data in client-side code
- [ ] No service role key exposed to frontend
- [ ] Environment variables properly configured
- [ ] Redirect URLs validated (no open redirects)
- [ ] Error messages don't leak sensitive info
- [ ] Logging doesn't include passwords or tokens
- [ ] Account deletion properly cascades
- [ ] Session timeout configured appropriately
- [ ] Token expiry configured appropriately

---

## 12. SUMMARY

### 12.1 Key Components

**New Pages** (8):

- /register
- /login
- /forgot-password
- /reset-password
- /settings

**Updated Pages** (3):

- / (index)
- /generate
- TopBar component

**New React Components** (7):

- RegistrationForm
- LoginForm
- ForgotPasswordForm
- ResetPasswordForm
- AccountSettings
- DeleteAccountDialog
- PasswordStrengthIndicator
- AuthErrorDisplay

**New API Endpoints** (2):

- POST /api/auth/logout
- POST /api/auth/delete-account

**Updated API Endpoints** (2):

- POST /api/flashcards/batch
- POST /api/flashcards/batch/[batchId]/review

**New Services** (1):

- AuthService

**Updated Services** (1):

- FlashcardBatchService (remove DEFAULT_USER_ID)

**New Database Policies** (12):

- RLS policies for flashcards (4)
- RLS policies for ai_generation_batches (4)
- RLS policies for study_sessions (4)

**Updated Database Constraints** (3):

- Cascade delete on flashcards.user_id
- Cascade delete on ai_generation_batches.user_id
- Cascade delete on study_sessions.user_id

---

### 12.2 Architecture Highlights

1. **Server-Side Session Management**: Secure HTTP-only cookies via @supabase/ssr
2. **Middleware-Based Authentication**: Session validation on every request
3. **Row Level Security**: Database-level enforcement of data isolation
4. **Progressive Enhancement**: Forms work without JavaScript, enhanced with React
5. **Unified Service Pattern**: Consistent class-based services with dependency injection
6. **Type Safety**: Full TypeScript coverage with Zod validation
7. **Security First**: PKCE flow, CSRF protection, XSS prevention, secure cookies
8. **User Experience**: Clear error messages, loading states, success feedback
9. **Scalability**: Designed to support future features (OAuth, 2FA, etc.)

---

### 12.3 Success Criteria

**Functional Requirements**:

- ✓ US-001: User registration with email verification
- ✓ US-002: User login with "remember me" option
- ✓ US-003: Password reset with email link
- ✓ US-004: Account deletion with password confirmation

**Technical Requirements**:

- ✓ Integration with Supabase Auth
- ✓ Secure session management with HTTP-only cookies
- ✓ Protected routes with middleware-based guards
- ✓ Row Level Security policies on all tables
- ✓ Cascade delete on account removal
- ✓ Client-side and server-side validation
- ✓ Consistent error handling and user feedback
- ✓ Compatibility with existing flashcard functionality

**Non-Functional Requirements**:

- ✓ No breaking changes to existing features
- ✓ Maintains performance (SSR optimization)
- ✓ Accessible forms with ARIA labels
- ✓ Responsive design (mobile-friendly)
- ✓ Clear documentation for future development

---

## 13. FUTURE ENHANCEMENTS

### 13.1 Post-MVP Authentication Features

**OAuth Providers** (Google, GitHub, etc.):

- Add social login buttons to login/register pages
- Configure OAuth providers in Supabase dashboard
- Update UI to support multiple auth methods

**Two-Factor Authentication (2FA)**:

- Add 2FA settings to account settings page
- Implement TOTP or SMS-based verification
- Update login flow to request 2FA code

**Magic Link Login**:

- Alternative to password login
- Send login link via email
- Simplify login experience

**Account Linking**:

- Link multiple OAuth providers to one account
- Manage linked accounts in settings
- Prevent duplicate accounts

**Session Management Dashboard**:

- Show active sessions to user
- Allow remote logout from other devices
- Security audit log

**Enhanced Password Security**:

- Password strength meter on registration
- Breached password detection (HaveIBeenPwned API)
- Force password change after N days
- Password history (prevent reuse)

---

### 13.2 User Profile Features

**User Profile Page**:

- Display name (editable)
- Avatar upload
- Bio/description
- Account statistics dashboard

**User Preferences**:

- Theme selection (light/dark mode)
- Language preference
- Email notification settings
- Study reminders configuration

**Data Export**:

- Export flashcards as CSV/JSON
- Export study session history
- GDPR compliance (data portability)

---

### 13.3 Advanced Security Features

**Rate Limiting Middleware**:

- Application-level rate limiting for sensitive endpoints
- Protect against brute force attacks
- Use Redis or Upstash for distributed rate limiting

**CAPTCHA Integration**:

- Add CAPTCHA to registration form
- Prevent automated abuse
- Use hCaptcha or reCAPTCHA

**Content Security Policy**:

- Strict CSP headers
- Prevent XSS attacks
- Whitelist trusted domains

**Audit Logging**:

- Log authentication events
- Track account changes
- Security monitoring dashboard

---

## APPENDIX A: File Structure Summary

```
src/
├── components/
│   ├── auth/                         # NEW
│   │   ├── RegistrationForm.tsx      # NEW
│   │   ├── LoginForm.tsx             # NEW
│   │   ├── ForgotPasswordForm.tsx    # NEW
│   │   ├── ResetPasswordForm.tsx     # NEW
│   │   ├── AccountSettings.tsx       # NEW
│   │   ├── DeleteAccountDialog.tsx   # NEW
│   │   ├── PasswordStrengthIndicator.tsx  # NEW
│   │   └── AuthErrorDisplay.tsx      # NEW
│   ├── TopBar.astro                  # UPDATED
│   └── Welcome.astro                 # UPDATED
├── db/
│   ├── supabase.client.ts            # UPDATED
│   ├── supabase.server.ts            # NEW
│   └── database.types.ts             # NO CHANGE
├── layouts/
│   └── Layout.astro                  # UPDATED
├── lib/
│   ├── auth.service.ts               # NEW
│   ├── auth.errors.ts                # NEW
│   ├── auth.schemas.ts               # NEW
│   └── flashcardBatch.service.ts     # UPDATED
├── middleware/
│   └── index.ts                      # UPDATED
├── pages/
│   ├── api/
│   │   ├── auth/                     # NEW
│   │   │   ├── logout.ts             # NEW
│   │   │   └── delete-account.ts     # NEW
│   │   └── flashcards/
│   │       └── batch/
│   │           ├── index.ts          # UPDATED
│   │           └── [batchId]/
│   │               └── review.ts     # UPDATED
│   ├── index.astro                   # UPDATED
│   ├── generate.astro                # UPDATED
│   ├── register.astro                # NEW
│   ├── login.astro                   # NEW
│   ├── forgot-password.astro         # NEW
│   ├── reset-password.astro          # NEW
│   └── settings.astro                # NEW
├── types/
│   └── auth.ts                       # NEW
├── types.ts                          # UPDATED
└── env.d.ts                          # UPDATED
```

---

## APPENDIX B: Environment Variables Reference

```bash
# .env

# Supabase Configuration (Server-side)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Configuration (Public - exposed to browser)
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Application URL (for email links)
PUBLIC_APP_URL=http://localhost:3000  # Development
# PUBLIC_APP_URL=https://app.example.com  # Production

# OpenRouter API Key (no change)
OPENROUTER_API_KEY=sk-or-v1-...

# Feature Flags (optional, for gradual rollout)
FEATURE_AUTH=true  # Enable authentication system
```

---

## APPENDIX C: Supabase Dashboard Configuration

**Authentication Settings**:

1. Navigate to Authentication → Settings
2. Enable email provider
3. Enable email confirmations
4. Set site URL: `PUBLIC_APP_URL`
5. Set redirect URLs:
   - `PUBLIC_APP_URL/reset-password`
   - `PUBLIC_APP_URL/login`
6. Configure rate limits:
   - Email send rate: 4 per hour
   - SMS send rate: N/A
7. Configure security:
   - JWT expiry: 3600 seconds (1 hour)
   - Refresh token expiry: 2592000 seconds (30 days)
   - Minimum password length: 8

**Email Templates**:

1. Navigate to Authentication → Email Templates
2. Customize "Confirm signup" template
3. Customize "Reset password" template
4. Test email delivery

**RLS Policies**:

1. Navigate to Database → Tables
2. For each table (flashcards, ai_generation_batches, study_sessions):
   - Enable RLS
   - Create policies as specified in section 3.4.2

**Foreign Key Constraints**:

1. Navigate to Database → Tables
2. Update foreign key constraints to CASCADE on delete
3. Test cascade behavior with SQL queries

---

## APPENDIX D: SQL Scripts

**Enable RLS and Create Policies**:

```sql
-- Flashcards table
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own flashcards" ON flashcards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcards" ON flashcards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcards" ON flashcards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcards" ON flashcards
  FOR DELETE USING (auth.uid() = user_id);

-- AI Generation Batches table
ALTER TABLE ai_generation_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own batches" ON ai_generation_batches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own batches" ON ai_generation_batches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own batches" ON ai_generation_batches
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own batches" ON ai_generation_batches
  FOR DELETE USING (auth.uid() = user_id);

-- Study Sessions table
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sessions" ON study_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON study_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON study_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON study_sessions
  FOR DELETE USING (auth.uid() = user_id);
```

**Update Foreign Key Constraints**:

```sql
-- Flashcards table
ALTER TABLE flashcards
  DROP CONSTRAINT IF EXISTS flashcards_user_id_fkey,
  ADD CONSTRAINT flashcards_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- AI Generation Batches table
ALTER TABLE ai_generation_batches
  DROP CONSTRAINT IF EXISTS ai_generation_batches_user_id_fkey,
  ADD CONSTRAINT ai_generation_batches_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- Study Sessions table
ALTER TABLE study_sessions
  DROP CONSTRAINT IF EXISTS study_sessions_user_id_fkey,
  ADD CONSTRAINT study_sessions_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;
```

**Test RLS Policies** (run as authenticated user):

```sql
-- Should return only rows owned by authenticated user
SELECT * FROM flashcards;

-- Should succeed (user owns row)
INSERT INTO flashcards (front_text, back_text, user_id, is_ai_generated, was_edited)
VALUES ('test', 'test', auth.uid(), false, false);

-- Should fail (user doesn't own row)
UPDATE flashcards SET front_text = 'hack' WHERE user_id != auth.uid();
```

---

END OF SPECIFICATION
