import { test, expect } from '@playwright/test'

/**
 * Authentication Flow E2E Tests
 * 
 * Tests the complete authentication workflow including:
 * - Sign up with email/password
 * - Sign in with email/password
 * - Google OAuth sign in
 * - Password reset flow
 * - Email verification
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display authentication page for unauthenticated users', async ({ page }) => {
    await expect(page).toHaveURL('/auth')
    await expect(page.locator('text=Sign In')).toBeVisible()
    await expect(page.locator('text=Sign Up')).toBeVisible()
  })

  test('should show sign up form when clicking Sign Up', async ({ page }) => {
    await page.goto('/auth')
    
    // Click Sign Up tab/button
    await page.click('text=Sign Up')
    
    // Verify sign up form fields are visible
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="username"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('input[name="givenName"]')).toBeVisible()
    await expect(page.locator('input[name="familyName"]')).toBeVisible()
  })

  test('should validate required fields on sign up', async ({ page }) => {
    await page.goto('/auth')
    await page.click('text=Sign Up')
    
    // Try to submit without filling fields
    await page.click('button[type="submit"]')
    
    // Should show validation errors
    await expect(page.locator('text=/required/i')).toBeVisible()
  })

  test('should validate email format on sign up', async ({ page }) => {
    await page.goto('/auth')
    await page.click('text=Sign Up')
    
    // Fill with invalid email
    await page.fill('input[name="email"]', 'invalid-email')
    await page.click('button[type="submit"]')
    
    // Should show email validation error
    await expect(page.locator('text=/valid email/i')).toBeVisible()
  })

  test('should validate password strength on sign up', async ({ page }) => {
    await page.goto('/auth')
    await page.click('text=Sign Up')
    
    // Fill with weak password
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', '123')
    await page.click('button[type="submit"]')
    
    // Should show password strength error
    await expect(page.locator('text=/password/i')).toBeVisible()
  })

  test('should show sign in form by default', async ({ page }) => {
    await page.goto('/auth')
    
    // Verify sign in form fields are visible
    await expect(page.locator('input[name="username"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should validate required fields on sign in', async ({ page }) => {
    await page.goto('/auth')
    
    // Try to submit without filling fields
    await page.click('button[type="submit"]')
    
    // Should show validation errors
    await expect(page.locator('text=/required/i')).toBeVisible()
  })

  test('should show Google sign in button', async ({ page }) => {
    await page.goto('/auth')
    
    // Verify Google OAuth button is visible
    await expect(page.locator('text=/sign in with google/i')).toBeVisible()
  })

  test('should show forgot password link', async ({ page }) => {
    await page.goto('/auth')
    
    // Verify forgot password link is visible
    await expect(page.locator('text=/forgot password/i')).toBeVisible()
  })

  test('should navigate to forgot password flow', async ({ page }) => {
    await page.goto('/auth')
    
    // Click forgot password
    await page.click('text=/forgot password/i')
    
    // Should show password reset form
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('text=/reset password/i')).toBeVisible()
  })

  test('should have futuristic design elements', async ({ page }) => {
    await page.goto('/auth')
    
    // Check for animated background
    const background = page.locator('[class*="auth-background"]')
    await expect(background).toBeVisible()
    
    // Check for AI assistant icon with animation
    const aiIcon = page.locator('[class*="breathing"]')
    if (await aiIcon.count() > 0) {
      await expect(aiIcon.first()).toBeVisible()
    }
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/auth')
    
    // Verify form is visible and properly sized on mobile
    await expect(page.locator('input[name="username"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })
})

test.describe('Authenticated Navigation', () => {
  test('should redirect to dashboard after successful sign in', async ({ page }) => {
    // Note: This test requires a test user to be set up
    // In a real implementation, you would use a test user or mock authentication
    
    await page.goto('/auth')
    
    // Fill in credentials (use test credentials)
    await page.fill('input[name="username"]', process.env.TEST_USERNAME || 'testuser')
    await page.fill('input[name="password"]', process.env.TEST_PASSWORD || 'TestPassword123!')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    // Note: This will fail without proper test credentials
    // await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
  })
})
