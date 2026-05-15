import { defineConfig } from '@playwright/test'
import { config } from 'dotenv'

// Load app secrets first (without override so they don't stomp test creds).
config({ path: '.env.local', override: false })
// Test-specific credentials take precedence.
config({ path: '.env.test' })

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
