# E2E Testing with Playwright

This directory contains end-to-end tests for the bidops.ai web application using Playwright.

## Setup

### Install Playwright

```bash
npm install -D @playwright/test
```

### Install Browsers

```bash
npx playwright install
```

## Running Tests

### Run all tests

```bash
npm run test:e2e
```

### Run tests in UI mode (interactive)

```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser)

```bash
npm run test:e2e:headed
```

### Run tests in debug mode

```bash
npm run test:e2e:debug
```

### Run specific test file

```bash
npx playwright test auth.spec.ts
```

### Run tests on specific browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run tests on mobile

```bash
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

## Test Structure

### Test Files

- `auth.spec.ts` - Authentication flow tests (sign in, sign up, password reset)
- `workflow.spec.ts` - Complete workflow tests (project creation, agent execution, artifact editing)
- `visual-regression.spec.ts` - Visual regression tests (themes, responsive, components)

### Helper Functions

- `helpers/auth.ts` - Authentication helper functions
- `helpers/workflow.ts` - Workflow helper functions

## Environment Variables

Create a `.env.test` file with test credentials:

```env
TEST_USERNAME=testuser
TEST_EMAIL=test@example.com
TEST_PASSWORD=TestPassword123!
TEST_GIVEN_NAME=Test
TEST_FAMILY_NAME=User
TEST_ROLE=BIDDER
BASE_URL=http://localhost:3000
```

## Visual Regression Testing

### Update Snapshots

When you intentionally change the UI, update the snapshots:

```bash
npm run test:e2e -- --update-snapshots
```

### Review Visual Differences

If visual tests fail, review the differences in the test report:

```bash
npm run test:e2e:report
```

## CI/CD Integration

The tests are configured to run in CI with:
- Retries on failure (2 retries)
- Single worker for consistency
- Automatic server startup
- HTML and JSON reports

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          TEST_USERNAME: ${{ secrets.TEST_USERNAME }}
          TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## Test Coverage

### Authentication Tests
- ✅ Display authentication page
- ✅ Sign up form validation
- ✅ Sign in form validation
- ✅ Google OAuth integration
- ✅ Password reset flow
- ✅ Email verification
- ✅ Responsive design

### Workflow Tests
- ✅ Project creation
- ✅ Document upload
- ✅ Knowledge base selection
- ✅ Agent workflow execution
- ✅ Chat interface
- ✅ Artifact display and editing
- ✅ Workflow navigation (forward/backward)
- ✅ Error handling and recovery

### Visual Regression Tests
- ✅ Theme consistency (Light, Dark, Deloitte, Futuristic)
- ✅ Responsive design (Mobile, Tablet, Desktop)
- ✅ Component consistency
- ✅ Animation rendering
- ✅ Accessibility (high contrast, reduced motion)

## Best Practices

1. **Use data-testid attributes** for stable selectors
2. **Wait for elements** before interacting
3. **Use helper functions** for common operations
4. **Mock external services** when possible
5. **Keep tests independent** - each test should be able to run alone
6. **Use meaningful test names** that describe what is being tested
7. **Clean up test data** after tests complete

## Debugging Tips

### Take screenshots on failure

```typescript
test('my test', async ({ page }) => {
  await page.screenshot({ path: 'screenshot.png' })
})
```

### Record video

Videos are automatically recorded on failure. Find them in `test-results/`.

### Use page.pause()

```typescript
test('my test', async ({ page }) => {
  await page.pause() // Opens Playwright Inspector
})
```

### Enable verbose logging

```bash
DEBUG=pw:api npm run test:e2e
```

## Known Issues

1. **Authentication Tests** - Require valid test credentials in AWS Cognito
2. **Workflow Tests** - Require backend services to be running
3. **Visual Tests** - May have slight differences across platforms

## Contributing

When adding new features:
1. Add corresponding E2E tests
2. Update visual regression tests if UI changes
3. Document any new helper functions
4. Update this README with new test coverage
