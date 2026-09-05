import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { _electron as electron, expect, test } from '@playwright/test'
import type { ElectronApplication, Page } from '@playwright/test'

const __dirname = dirname(fileURLToPath(import.meta.url))
const APP_ROOT = join(__dirname, '..')

let electronApp: ElectronApplication
let window: Page

test.beforeEach(async () => {
  electronApp = await electron.launch({
    args: [APP_ROOT],
    env: {
      ...process.env,
      // Erzwingt Chromiums Headless-Rendering, damit die App auch ohne
      // angeschlossenes Display (CI-Runner ohne Xvfb) startet, siehe
      // `electron/main.ts`.
      E2E_HEADLESS: '1',
    },
  })
  window = await electronApp.firstWindow()
  await window.waitForLoadState('domcontentloaded')
})

test.afterEach(async () => {
  await electronApp.close()
})

test('App startet, Hauptfenster öffnet und Startansicht ist sichtbar', async () => {
  expect(electronApp.windows()).toHaveLength(1)

  await expect(
    window.getByRole('navigation', { name: 'Hauptnavigation' }),
  ).toBeVisible()

  // Startansicht: der Rechner ist standardmäßig aktiv (siehe `AppShell.tsx`).
  await expect(window.getByRole('button', { name: 'Rechner' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(window.getByRole('heading', { name: 'Rechner' })).toBeVisible()
  await expect(window.getByLabel('Ausdruck')).toBeVisible()
})
