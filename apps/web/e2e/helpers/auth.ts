import { Page } from '@playwright/test'

/**
 * Authentication Helper Functions for E2E Tests
 */

export interface TestUser {
  username: string
  email: string
  password: string
  givenName: string
  familyName: string
  role: string
}

/**
 * Sign in with username and password
 */
export async function signIn(page: Page, username: string, password: string) {
  await page.goto('/auth')
  
  await page.fill('input[name="username"]', username)
  await page.fill('input[name="password"]', password)
  
  await page.click('button[type="submit"]')
  
  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 })
}

/**
 * Sign up with email and password
 */
export async function signUp(page: Page, user: TestUser) {
  await page.goto('/auth')
  
  // Click Sign Up tab
  await page.click('text=Sign Up')
  
  // Fill in form
  await page.fill('input[name="email"]', user.email)
  await page.fill('input[name="username"]', user.username)
  await page.fill('input[name="password"]', user.password)
  await page.fill('input[name="givenName"]', user.givenName)
  await page.fill('input[name="familyName"]', user.familyName)
  
  // Submit form
  await page.click('button[type="submit"]')
  
  // Wait for verification message
  await page.waitForSelector('text=/verify your email/i', { timeout: 10000 })
}

/**
 * Sign out
 */
export async function signOut(page: Page) {
  // Click user menu
  await page.click('[data-testid="user-menu"]')
  
  // Click sign out
  await page.click('text=/sign out/i')
  
  // Wait for redirect to auth page
  await page.waitForURL('/auth', { timeout: 10000 })
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check for authenticated elements
    const userMenu = await page.locator('[data-testid="user-menu"]').count()
    return userMenu > 0
  } catch {
    return false
  }
}

/**
 * Get test user credentials from environment
 */
export function getTestUser(): TestUser {
  return {
    username: process.env.TEST_USERNAME || 'testuser',
    email: process.env.TEST_EMAIL || 'test@example.com',
    password: process.env.TEST_PASSWORD || 'TestPassword123!',
    givenName: process.env.TEST_GIVEN_NAME || 'Test',
    familyName: process.env.TEST_FAMILY_NAME || 'User',
    role: process.env.TEST_ROLE || 'BIDDER',
  }
}

/**
 * Setup authenticated session for tests
 */
export async function setupAuthenticatedSession(page: Page) {
  const user = getTestUser()
  
  try {
    await signIn(page, user.username, user.password)
  } catch (error) {
    console.warn('Failed to sign in with test user. Tests requiring authentication will be skipped.')
    throw error
  }
}
