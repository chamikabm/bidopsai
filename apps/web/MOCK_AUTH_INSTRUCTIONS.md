# Mock Authentication for UI Testing

## ⚠️ WARNING: TESTING ONLY - REMOVE BEFORE PRODUCTION

This feature allows you to bypass Cognito authentication during UI testing to verify the interface without needing AWS credentials.

## How to Enable Mock Auth

1. Create a `.env.local` file in the `apps/web` directory:
   ```bash
   cd apps/web
   cp .env.local.example .env.local
   ```

2. Add this line to `.env.local`:
   ```
   NEXT_PUBLIC_MOCK_AUTH=true
   ```

3. Restart your development server:
   ```bash
   npm run dev
   ```

4. Sign in with ANY username and password - all credentials will be accepted!

## What Gets Bypassed

When mock auth is enabled:
- ✅ Sign in always succeeds
- ✅ No Cognito API calls
- ✅ Session stored in localStorage
- ✅ You can access protected routes
- ✅ Console shows "🔧 MOCK AUTH" messages

## How to Test

1. Go to `http://localhost:3000/signin`
2. Enter any username (e.g., "test")
3. Enter any password (e.g., "password123")
4. Click "Sign In"
5. You'll be redirected to the dashboard

## How to Remove Mock Auth (Before Production)

### Step 1: Disable in Environment
Remove or set to false in `.env.local`:
```bash
# Comment out or remove this line
# NEXT_PUBLIC_MOCK_AUTH=true
```

### Step 2: Delete Mock Auth Files
```bash
# Delete the mock auth implementation
rm apps/web/src/lib/auth/mock-auth.ts

# Delete this instructions file
rm apps/web/MOCK_AUTH_INSTRUCTIONS.md
```

### Step 3: Clean Up useAuth Hook (`apps/web/src/hooks/useAuth.ts`)

**Remove the import:**
```typescript
// DELETE THIS LINE:
import { MOCK_AUTH_ENABLED, mockSignIn, hasMockSession, clearMockSession } from '@/lib/auth/mock-auth';
```

**In `useCurrentUser()` function, remove:**
```typescript
// DELETE THESE LINES (around line 50-53):
// Mock auth bypass
if (MOCK_AUTH_ENABLED && hasMockSession()) {
  return { username: 'mock-user', userId: 'mock-123' };
}
```

**In `useSignIn()` function, remove:**
```typescript
// DELETE THESE LINES (around line 93-97):
// Mock auth bypass for testing
if (MOCK_AUTH_ENABLED) {
  console.warn('⚠️  MOCK AUTH ENABLED - Bypassing Cognito authentication');
  return await mockSignIn(username, password);
}
```

**In `useSignOut()` function, remove:**
```typescript
// DELETE THESE LINES (around line 260-264):
// Mock auth bypass
if (MOCK_AUTH_ENABLED) {
  clearMockSession();
  return;
}
```

### Step 4: Clean Up Middleware (`apps/web/src/middleware.ts`)

**Remove the constant declaration:**
```typescript
// DELETE THESE LINES (around line 12-13):
// Check if mock auth is enabled
const MOCK_AUTH_ENABLED = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
```

**Remove the middleware bypass:**
```typescript
// DELETE THESE LINES (around line 45-49):
// Mock auth bypass - allow all requests when enabled
if (MOCK_AUTH_ENABLED) {
  console.log('🔧 MOCK AUTH: Middleware bypassed for', pathname);
  return NextResponse.next();
}
```

**Update the comment at the top:**
```typescript
// CHANGE FROM:
/**
 * Supports mock auth bypass for testing (NEXT_PUBLIC_MOCK_AUTH=true)
 */

// CHANGE TO:
/**
 * This middleware runs on every request to verify user authentication via Cognito.
 */
```

### Step 5: Verify Complete Removal
```bash
# Search for any remaining references
grep -r "MOCK_AUTH" apps/web/src
grep -r "mock-auth" apps/web/src
grep -r "mockSignIn" apps/web/src
grep -r "hasMockSession" apps/web/src

# Should return no results - if it does, remove those references too
```

### Step 6: Test Production Build
```bash
# Build the app to ensure no errors
cd apps/web
npm run build

# If build succeeds, mock auth is completely removed
```

## Security Notes

- 🔴 **NEVER deploy with mock auth enabled**
- 🔴 **Never commit `.env.local` with `NEXT_PUBLIC_MOCK_AUTH=true`**
- 🟢 `.env.local` is in `.gitignore` by default
- 🟢 Mock auth only works in development mode
- 🟢 Console warnings alert you when mock auth is active

## Troubleshooting

**Problem**: Mock auth not working
- Solution: Restart dev server after changing `.env.local`

**Problem**: Still prompted for real credentials
- Solution: Check console for "MOCK AUTH ENABLED" message
- Solution: Verify `.env.local` has `NEXT_PUBLIC_MOCK_AUTH=true`

**Problem**: Can't access protected routes
- Solution: Clear localStorage and sign in again

## Quick Commands

```bash
# Enable mock auth
echo "NEXT_PUBLIC_MOCK_AUTH=true" >> apps/web/.env.local

# Disable mock auth  
sed -i '' '/NEXT_PUBLIC_MOCK_AUTH/d' apps/web/.env.local

# Remove all mock auth files
rm apps/web/src/lib/auth/mock-auth.ts apps/web/MOCK_AUTH_INSTRUCTIONS.md