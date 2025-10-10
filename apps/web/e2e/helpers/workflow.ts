import { Page, expect } from '@playwright/test'

/**
 * Workflow Helper Functions for E2E Tests
 */

export interface ProjectData {
  name: string
  description: string
  deadline?: string
  documents?: string[]
  knowledgeBases?: string[]
}

/**
 * Create a new project
 */
export async function createProject(page: Page, projectData: ProjectData) {
  await page.goto('/projects/new')
  
  // Fill in basic info
  await page.fill('input[name="name"]', projectData.name)
  await page.fill('textarea[name="description"]', projectData.description)
  
  if (projectData.deadline) {
    await page.fill('input[name="deadline"]', projectData.deadline)
  }
  
  // Upload documents if provided
  if (projectData.documents && projectData.documents.length > 0) {
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(projectData.documents)
  }
  
  // Select knowledge bases if provided
  if (projectData.knowledgeBases && projectData.knowledgeBases.length > 0) {
    for (const kb of projectData.knowledgeBases) {
      await page.click(`text=${kb}`)
    }
  }
  
  // Submit form
  await page.click('button[type="submit"]')
  
  // Wait for workflow to start
  await page.waitForSelector('[data-testid="workflow-progress"]', { timeout: 10000 })
}

/**
 * Wait for agent to complete
 */
export async function waitForAgent(page: Page, agentType: string, timeout = 30000) {
  await page.waitForSelector(
    `[data-agent-type="${agentType}"][data-status="COMPLETED"]`,
    { timeout }
  )
}

/**
 * Send chat message
 */
export async function sendChatMessage(page: Page, message: string) {
  const chatInput = page.locator('textarea[placeholder*="message"]')
  await chatInput.fill(message)
  
  const sendButton = page.locator('button[aria-label="Send message"]')
  await sendButton.click()
  
  // Wait for message to be sent
  await page.waitForTimeout(500)
}

/**
 * Wait for artifact tiles to appear
 */
export async function waitForArtifacts(page: Page, timeout = 30000) {
  await page.waitForSelector('[data-testid="artifact-tile"]', { timeout })
}

/**
 * Open artifact editor
 */
export async function openArtifactEditor(page: Page, artifactIndex = 0) {
  const artifactTiles = page.locator('[data-testid="artifact-tile"]')
  await artifactTiles.nth(artifactIndex).click()
  
  // Wait for modal to open
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
}

/**
 * Edit artifact content
 */
export async function editArtifactContent(page: Page, content: string) {
  // Wait for TipTap editor
  const editor = page.locator('.ProseMirror')
  await editor.waitFor({ timeout: 5000 })
  
  // Clear existing content
  await editor.click()
  await page.keyboard.press('Control+A')
  await page.keyboard.press('Backspace')
  
  // Type new content
  await editor.type(content)
}

/**
 * Save artifact edits
 */
export async function saveArtifactEdits(page: Page) {
  const saveButton = page.locator('button:has-text("Save")')
  await saveButton.click()
  
  // Wait for modal to close
  await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 })
}

/**
 * Check workflow progress
 */
export async function getWorkflowProgress(page: Page): Promise<number> {
  const progressBar = page.locator('[data-testid="workflow-progress"]')
  const progressText = await progressBar.getAttribute('aria-valuenow')
  return progressText ? parseInt(progressText, 10) : 0
}

/**
 * Wait for workflow completion
 */
export async function waitForWorkflowCompletion(page: Page, timeout = 120000) {
  await page.waitForSelector(
    '[data-testid="workflow-status"][data-status="COMPLETED"]',
    { timeout }
  )
}

/**
 * Approve workflow step
 */
export async function approveWorkflowStep(page: Page) {
  await sendChatMessage(page, 'Approved')
}

/**
 * Request workflow revision
 */
export async function requestRevision(page: Page, feedback: string) {
  await sendChatMessage(page, feedback)
}

/**
 * Get current workflow step
 */
export async function getCurrentWorkflowStep(page: Page): Promise<string> {
  const activeStep = page.locator('[data-testid="workflow-step"][data-active="true"]')
  return await activeStep.getAttribute('data-step-name') || ''
}

/**
 * Check if workflow is waiting for user input
 */
export async function isWaitingForInput(page: Page): Promise<boolean> {
  const chatInput = page.locator('textarea[placeholder*="message"]')
  return await chatInput.isEnabled()
}
