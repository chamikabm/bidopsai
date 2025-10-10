# Authentication Implementation

This directory contains the authentication implementation for bidops.ai using AWS Amplify Gen 2 and AWS Cognito.

## Overview

The authentication system provides:
- Custom sign-in and sign-up forms (no default Amplify UI)
- Email verification flow
- Google OAuth integration
- Role-based access control (RBAC)
- Server-side session management
- Protected routes via Next.js middleware

## User Roles

The system supports five user roles with different permissions:

### Admin
- Full access to all features
- Can manage users
- Can manage global and local knowledge bases
- Can access all workflow steps including Comms and Submission

### Bidder
- Full workflow access
- Can manage local knowledge bases
- Can access Comms and Submission agents
- Cannot manage users or global KBs

### Drafter
- Limited workflow access (only through QA process)
- Cannot access Comms or Submission agents
- Read-only access to knowledge bases

### KB-Admin
- Full access to knowledge base management
- Can manage both global and local KBs
- No workflow access

### KB-View
- Read-only access to knowledge bases
- No workflow or management access

## Setup Instructions

### 1. Configure AWS Cognito

1. Create a Cognito User Pool in AWS Console
2. Enable email verification
3. Configure Google OAuth provider:
   - Add Google as an identity provider
   - Configure OAuth scopes: email, profile, openid
   - Set callback URLs and logout URLs
4. Create custom attributes:
   - `custom:role` (String)
   - `custom:permissions` (String)

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
# AWS Cognito Configuration
NEXT_PUBLIC_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_IDENTITY_POOL_ID=us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_OAUTH_DOMAIN=your-domain.auth.us-east-1.amazoncognito.com
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Deploy Amplify Backend

```bash
cd apps/web
npx ampx sandbox
```

This will deploy the Amplify Gen 2 backend resources defined in `amplify/` directory.

## Usage

### Client-Side Authentication

Use the `useAuth` hook in your components:

```tsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, isLoading, signOut } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please sign in</div>;

  return (
    <div>
      <p>Welcome, {user.givenName}!</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Permission Checking

Use the `usePermissions` hook for role-based UI:

```tsx
import { usePermissions } from '@/hooks/usePermissions';

function AdminPanel() {
  const { hasPermission } = usePermissions();

  if (!hasPermission('canManageUsers')) {
    return <div>Access denied</div>;
  }

  return <div>Admin content</div>;
}
```

### Server-Side Authentication

In API routes, use the Amplify server utilities:

```tsx
import { fetchAuthSession } from 'aws-amplify/auth/server';
import { runWithAmplifyServerContext } from '@/lib/auth/amplify-server-utils';

export async function GET(request: NextRequest) {
  const session = await runWithAmplifyServerContext({
    nextServerContext: { request },
    operation: async (contextSpec) => {
      return await fetchAuthSession(contextSpec);
    },
  });

  if (!session.tokens) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Your authenticated logic here
}
```

## Protected Routes

Routes are automatically protected by the Next.js middleware in `src/middleware.ts`.

Protected routes:
- `/dashboard`
- `/projects`
- `/knowledge-bases`
- `/users` (Admin only)
- `/settings` (Admin only)

Public routes:
- `/auth`
- `/api/auth/*`

## API Routes

### POST /api/auth/signin
Sign in with username/password

### POST /api/auth/signup
Create a new user account

### POST /api/auth/signout
Sign out the current user

### GET /api/auth/session
Get current user session

### GET /api/auth/callback
OAuth callback handler for Google sign-in

## Components

### SignInForm
Custom sign-in form with username/password and Google OAuth

### SignUpForm
Custom sign-up form with email verification flow

### AuthBackground
Futuristic animated background for auth pages

### GoogleSignIn
Google OAuth button component

## Security Features

- Server-side session validation
- Role-based access control (RBAC)
- Protected API routes
- Secure token storage
- MFA support (optional)
- Password strength requirements
- Email verification required

## Troubleshooting

### "User not found" error
- Check that the user exists in Cognito User Pool
- Verify the username/email is correct

### OAuth redirect issues
- Verify callback URLs in Cognito match your app URL
- Check that Google OAuth is properly configured

### Session not persisting
- Check that cookies are enabled
- Verify Amplify configuration is correct
- Check browser console for errors

## Next Steps

1. Implement forgot password flow
2. Add MFA configuration UI
3. Implement user profile editing
4. Add social login for other providers (Microsoft, etc.)
5. Implement refresh token rotation
