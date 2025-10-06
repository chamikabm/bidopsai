import { test, expect } from '@playwright/test'

/**
 * Visual Regression Tests
 * 
 * Tests visual consistency across different themes and viewports
 * Uses Playwright's screenshot comparison feature
 * 
 * To update snapshots: npm run test:e2e -- --update-snapshots
 */

test.describe('Visual Regression - Themes', () => {
  const themes = ['light', 'dark', 'deloitte', 'futuristic']

  for (const theme of themes) {
    test(`should render auth page correctly in ${theme} theme`, async ({ page }) => {
      await page.goto('/auth')
      
      // Set theme (implementation depends on how theme is stored)
      await page.evaluate((themeName) => {
        localStorage.setItem('theme', themeName)
      }, theme)
      
      await page.reload()
      
      // Wait for animations to complete
      await page.waitForTimeout(1000)
      
      // Take screenshot
      await expect(page).toHaveScreenshot(`auth-${theme}.png`, {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test(`should render dashboard correctly in ${theme} theme`, async ({ page }) => {
      // Note: Requires authentication
      await page.goto('/dashboard')
      
      await page.evaluate((themeName) => {
        localStorage.setItem('theme', themeName)
      }, theme)
      
      await page.reload()
      await page.waitForTimeout(1000)
      
      await expect(page).toHaveScreenshot(`dashboard-${theme}.png`, {
        fullPage: true,
        animations: 'disabled',
      })
    })
  }
})

test.describe('Visual Regression - Responsive', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 },
  ]

  for (const viewport of viewports) {
    test(`should render auth page correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/auth')
      
      await page.waitForTimeout(1000)
      
      await expect(page).toHaveScreenshot(`auth-${viewport.name}.png`, {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test(`should render project list correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/projects')
      
      await page.waitForTimeout(1000)
      
      await expect(page).toHaveScreenshot(`projects-${viewport.name}.png`, {
        fullPage: true,
        animations: 'disabled',
      })
    })
  }
})

test.describe('Visual Regression - Components', () => {
  test('should render buttons consistently', async ({ page }) => {
    await page.goto('/auth')
    
    // Take screenshot of button variants
    const button = page.locator('button[type="submit"]').first()
    await expect(button).toHaveScreenshot('button-default.png')
  })

  test('should render cards consistently', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Take screenshot of stat cards
    const card = page.locator('[data-testid="stat-card"]').first()
    if (await card.count() > 0) {
      await expect(card).toHaveScreenshot('stat-card.png')
    }
  })

  test('should render forms consistently', async ({ page }) => {
    await page.goto('/projects/new')
    
    // Take screenshot of form
    const form = page.locator('form').first()
    await expect(form).toHaveScreenshot('project-form.png')
  })
})

test.describe('Visual Regression - Animations', () => {
  test('should render AI assistant breathing animation', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Find AI assistant icon
    const aiIcon = page.locator('[data-testid="ai-assistant-icon"]')
    if (await aiIcon.count() > 0) {
      // Take multiple screenshots to verify animation
      await expect(aiIcon).toHaveScreenshot('ai-icon-frame1.png')
      
      await page.waitForTimeout(500)
      await expect(aiIcon).toHaveScreenshot('ai-icon-frame2.png')
    }
  })

  test('should render progress bar animations', async ({ page }) => {
    // Note: Requires active workflow
    await page.goto('/projects/1') // Example project ID
    
    const progressBar = page.locator('[data-testid="workflow-progress"]')
    if (await progressBar.count() > 0) {
      await expect(progressBar).toHaveScreenshot('progress-bar.png', {
        animations: 'disabled',
      })
    }
  })
})

test.describe('Visual Regression - Dark Mode', () => {
  test('should render all pages consistently in dark mode', async ({ page }) => {
    // Set dark mode
    await page.emulateMedia({ colorScheme: 'dark' })
    
    const pages = ['/auth', '/dashboard', '/projects', '/knowledge-bases', '/settings']
    
    for (const pagePath of pages) {
      await page.goto(pagePath)
      await page.waitForTimeout(1000)
      
      const pageName = pagePath.replace(/\//g, '-') || 'root'
      await expect(page).toHaveScreenshot(`dark-mode${pageName}.png`, {
        fullPage: true,
        animations: 'disabled',
      })
    }
  })
})

test.describe('Visual Regression - Accessibility', () => {
  test('should maintain visual consistency with high contrast', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await page.goto('/auth')
    
    await page.waitForTimeout(1000)
    
    await expect(page).toHaveScreenshot('auth-high-contrast.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('should maintain visual consistency with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/dashboard')
    
    await page.waitForTimeout(1000)
    
    await expect(page).toHaveScreenshot('dashboard-reduced-motion.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })
})
