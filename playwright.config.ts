import { defineConfig } from '@playwright/test'

// E2E-Setup für die Electron-App (IRGENDWAST-16). Die Tests starten die
// gebaute App (`dist-electron/main.js`, siehe `npm run build`) statt des
// Vite-Dev-Servers, damit geprüft wird, was tatsächlich ausgeliefert wird.
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  outputDir: 'test-results',
  use: {
    // Bei Fehlschlägen werden Screenshot und Trace als Artefakte abgelegt,
    // damit ein CI-Lauf ohne manuelle Interaktion nachvollziehbar bleibt.
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
})
