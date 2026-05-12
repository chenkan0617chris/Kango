import { test, expect, type Page } from '@playwright/test'

const EMAIL    = process.env.E2E_EMAIL    ?? ''
const PASSWORD = process.env.E2E_PASSWORD ?? ''

async function loginViaUI(page: Page) {
  await page.goto('/login')
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('/', { timeout: 10_000 })
}

test('tourist can log in with valid credentials', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASSWORD)
  await page.click('button[type="submit"]')

  await page.waitForURL('/', { timeout: 10_000 })

  // Navbar renders a blue avatar circle only when authenticated
  await expect(page.locator('nav .rounded-full.bg-blue-900.text-white')).toBeVisible()
})

test('tourist can publish a demand after logging in', async ({ page }) => {
  await loginViaUI(page)
  await page.goto('/demand/create')

  // Pickup location — type partial, then click the autocomplete suggestion
  await page.fill('input[placeholder="如：Melbourne Airport (MEL)"]', 'Melbourne')
  await page.getByText('Melbourne CBD, VIC').first().click()

  // Dropoff location
  await page.fill('input[placeholder="如：Great Ocean Road, VIC"]', 'Sydney')
  await page.getByText('Sydney CBD, NSW').first().click()

  // Travel date (tomorrow, to satisfy the min={today} constraint)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  await page.fill('input[type="date"]', tomorrow.toISOString().split('T')[0])

  await page.getByRole('button', { name: '发布行程需求' }).click()
  await page.waitForURL('/tourist/dashboard', { timeout: 15_000 })
})
