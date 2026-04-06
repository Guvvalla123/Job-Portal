import { test, expect } from '@playwright/test'

const CANDIDATE_EMAIL = process.env.E2E_CANDIDATE_EMAIL || 'e2e-candidate@jobportal.test'
const PASSWORD = process.env.E2E_PASSWORD || 'SecurePass1!'

test.describe('public shell', () => {
  test('home loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/CareerSync|Job/i)
  })

  test('jobs page shows heading', async ({ page }) => {
    await page.goto('/jobs')
    await expect(page.getByRole('heading', { name: /browse jobs/i })).toBeVisible()
  })
})

test.describe('authenticated apply flow', () => {
  test('login → job detail → apply → sign out', async ({ page }) => {
    test.skip(process.env.E2E_FULL !== '1', 'Set E2E_FULL=1 in CI with API, seed, and vite preview (see docs/DEPLOYMENT.md)')

    await page.goto('/login')
    await page.locator('#login-email').fill(CANDIDATE_EMAIL)
    await page.locator('#login-password').fill(PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL(/\/candidate\/dashboard|\/dashboard/, { timeout: 30000 })

    await page.goto('/jobs')
    await page.getByRole('link', { name: new RegExp('E2E Apply Target Job', 'i') }).first().click()
    await page.waitForURL(/\/jobs\//, { timeout: 15000 })

    await page.getByRole('button', { name: /apply now/i }).click()
    const applyResponse = page.waitForResponse(
      (r) => r.url().includes('/applications') && r.request().method() === 'POST' && r.ok(),
      { timeout: 30000 },
    )
    await page.getByRole('button', { name: /submit application/i }).click()
    await applyResponse

    await page.getByRole('button', { name: /account menu/i }).click()
    await page.getByText('Sign out').click()
    await page.waitForURL(/\/login/, { timeout: 20000 })
  })
})
