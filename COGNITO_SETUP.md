# Cognito Setup Guide - BidOps.AI

Complete guide for setting up and using AWS Cognito authentication with your frontend.

## ✅ Stack Deployed Successfully!

Your Cognito User Pool is now live with the following configuration:

### Stack Outputs
```
User Pool ID:       <from cdk-outputs>
Client ID:          <from cdk-outputs>
Domain:             bidopsai-dev.auth.<region>.amazoncognito.com
Region:             <your-aws-region>
```

Run `make cdk-outputs` to get your actual values.

## 1. Frontend Configuration

Configure the frontend environment variables in `apps/web/.env`:

```bash
# Cognito configuration
NEXT_PUBLIC_AWS_REGION=<your-region>
NEXT_PUBLIC_COGNITO_USER_POOL_ID=<your-pool-id>
NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=<your-client-id>
NEXT_PUBLIC_COGNITO_DOMAIN=<your-domain>
```

### How the Frontend Uses Cognito

The app is already configured to use Cognito through:

1. **Amplify Configuration** - [`apps/web/src/lib/auth/amplify.config.ts`](apps/web/src/lib/auth/amplify.config.ts)
   - Reads environment variables
   - Configures AWS Amplify Auth

2. **Authentication Hook** - [`apps/web/src/hooks/useAuth.ts`](apps/web/src/hooks/useAuth.ts)
   - Provides sign-in, sign-out, sign-up functions
   - Returns current user and session info

3. **Middleware** - [`apps/web/src/middleware.ts`](apps/web/src/middleware.ts)
   - Protects routes requiring authentication
   - Redirects to sign-in if not authenticated

4. **Sign-In Form** - [`apps/web/src/components/auth/SignInForm.tsx`](apps/web/src/components/auth/SignInForm.tsx)
   - Uses Cognito for authentication
   - Handles errors and redirects

## 2. Create Test Users

### Option A: Using the Script (Recommended)

```bash
# Make script executable
chmod +x infra/cdk/scripts/create-test-users.sh

# Run script
./infra/cdk/scripts/create-test-users.sh
```

This creates two test users with appropriate roles. Check the script output for credentials.

### Option B: Manual Creation

```bash
USER_POOL_ID="<your-user-pool-id>"

# Create Admin User
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username admin@example.com \
  --user-attributes \
    Name=email,Value=admin@example.com \
    Name=email_verified,Value=true \
    Name=given_name,Value=Admin \
    Name=family_name,Value=User \
  --message-action SUPPRESS

aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username admin@example.com \
  --password "YourSecurePassword123!" \
  --permanent

aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username admin@example.com \
  --group-name ADMIN
```

## 3. Testing Authentication

### Start the Development Server

```bash
cd apps/web
npm run dev
```

### Test Login

1. Go to http://localhost:3000
2. You'll be redirected to http://localhost:3000/signin
3. Sign in with the test user credentials created by the script

### Verify User Groups

After signing in, check the console logs or use:

```typescript
// In any component
const { user } = useAuth();
console.log(user?.groups); // ['ADMIN'] or ['KB_VIEW']
```

## 4. User Groups & Permissions

The Cognito User Pool includes 5 groups:

| Group | Precedence | Description |
|-------|------------|-------------|
| `ADMIN` | 1 | Full access to all features and settings |
| `DRAFTER` | 2 | Can work on drafts up to QA process |
| `BIDDER` | 3 | Full workflow access + local KB management |
| `KB_ADMIN` | 4 | Full CRUD access to all knowledge bases |
| `KB_VIEW` | 5 | Read-only access to knowledge bases |

### How to Use Groups in Your Code

```typescript
// Check if user has specific role
import { usePermissions } from '@/hooks/usePermissions';

function MyComponent() {
  const { isAdmin, hasKBAccess } = usePermissions();
  
  if (isAdmin) {
    // Show admin features
  }
  
  if (hasKBAccess) {
    // Show knowledge base features
  }
}
```

## 5. Adding More Users

### Create User with Specific Group

```bash
USER_POOL_ID="<your-user-pool-id>"

# Create user
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username user@example.com \
  --user-attributes \
    Name=email,Value=user@example.com \
    Name=email_verified,Value=true \
    Name=given_name,Value=FirstName \
    Name=family_name,Value=LastName \
  --message-action SUPPRESS

# Set password
aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username user@example.com \
  --password "YourSecurePassword123!" \
  --permanent

# Add to group (choose one: ADMIN, DRAFTER, BIDDER, KB_ADMIN, KB_VIEW)
aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username user@example.com \
  --group-name BIDDER
```

## 6. User Self-Registration

Users can also sign up through the app:

1. Go to http://localhost:3000/signup
2. Fill in the registration form
3. Verify email with the code sent
4. Sign in

**Note:** Self-registered users won't be in any group by default. Admins need to assign groups manually.

## 7. Managing Users

### List All Users

```bash
aws cognito-idp list-users \
  --user-pool-id <your-user-pool-id>
```

### Delete a User

```bash
aws cognito-idp admin-delete-user \
  --user-pool-id <your-user-pool-id> \
  --username user@example.com
```

### Reset User Password

```bash
aws cognito-idp admin-set-user-password \
  --user-pool-id <your-user-pool-id> \
  --username user@example.com \
  --password "YourNewPassword123!" \
  --permanent
```

### List Users in a Group

```bash
aws cognito-idp list-users-in-group \
  --user-pool-id <your-user-pool-id> \
  --group-name ADMIN
```

## 8. Troubleshooting

### "User does not exist" Error
- Make sure the user was created successfully
- Check the email is correct
- Verify in AWS Console: Cognito → User Pools → bidopsai-users-dev → Users

### "Password does not meet requirements"
Password must have:
- At least 12 characters
- Uppercase letters
- Lowercase letters
- Numbers
- Symbols

### "Not authorized" Error
- User might not be in the correct group
- Check user groups with: `aws cognito-idp admin-list-groups-for-user`

### Frontend Not Using Cognito
- Restart the dev server after changing `.env`
- Verify Cognito environment variables are set
- Check browser console for AWS Amplify errors

## 9. Production Deployment

When deploying to production:

1. **Deploy Production Stack**
   ```bash
   make cdk-deploy-prod
   ```

2. **Update Production Environment Variables**
   ```bash
   # In production .env
   NEXT_PUBLIC_AWS_REGION=<your-region>
   NEXT_PUBLIC_COGNITO_USER_POOL_ID=<prod-pool-id>
   NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=<prod-client-id>
   NEXT_PUBLIC_COGNITO_DOMAIN=bidopsai-prod.auth.<region>.amazoncognito.com
   ```

3. **Create Production Admin**
   ```bash
   # Use production User Pool ID
   USER_POOL_ID="<prod-pool-id>"
   # Run create user commands
   ```

## Quick Reference

```bash
# View stack outputs
make cdk-outputs

# Create test users
./infra/cdk/scripts/create-test-users.sh

# Start dev server
cd apps/web && npm run dev

# Test login
open http://localhost:3000
```

## Support

For issues:
- Check AWS Cognito console: https://console.aws.amazon.com/cognito/
- Review CloudWatch logs for errors
- Check the Cognito setup in [`apps/web/.env`](apps/web/.env)