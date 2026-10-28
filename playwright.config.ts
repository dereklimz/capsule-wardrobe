import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'e2e', timeout: 60000, retries: 0,
  use: { baseURL: 'http://localhost:4173', launchOptions: { executablePath: process.env.CHROMIUM_PATH || undefined } },
  webServer: { command: 'npm run build && npm run preview', url: 'http://localhost:4173', reuseExistingServer: true, timeout: 120000 },
});
