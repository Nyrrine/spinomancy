import { defineConfig } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  testDir: './tests',
  timeout: 300000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5213',
    launchOptions: {
      executablePath: '/home/joaquin/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
    },
    screenshot: 'on',
    video: 'off',
    trace: 'off',
  },
  workers: 1,
  webServer: {
    command: 'npx vite build && npx vite preview --port 5213',
    port: 5213,
    timeout: 120000,
    reuseExistingServer: true,
    cwd: __dirname,
  },
})
