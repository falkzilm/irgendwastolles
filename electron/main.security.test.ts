/**
 * Bewacht die in docs/security.md dokumentierten Härtungsmaßnahmen für den
 * Main-Prozess. Der Test prüft den Quellcode statisch (statt `electron/main.ts`
 * zu importieren), weil das `electron`-Modul außerhalb der Electron-Runtime
 * nicht die echte API bereitstellt.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const mainSource = readFileSync(join(__dirname, 'main.ts'), 'utf8')

test('BrowserWindow wird mit contextIsolation, ohne nodeIntegration und mit sandbox erzeugt', () => {
  assert.match(mainSource, /contextIsolation:\s*true/)
  assert.match(mainSource, /nodeIntegration:\s*false/)
  assert.match(mainSource, /sandbox:\s*true/)
})

test('eine Content-Security-Policy wird gesetzt', () => {
  assert.match(mainSource, /['"]Content-Security-Policy['"]/)
  assert.match(mainSource, /default-src 'self'/)
})

test('neue Fenster (window.open) werden im Main-Prozess abgelehnt', () => {
  assert.match(mainSource, /setWindowOpenHandler\(/)
  assert.match(mainSource, /action:\s*['"]deny['"]/)
})

test('Navigationsversuche werden im Main-Prozess abgefangen', () => {
  assert.match(mainSource, /\.on\(\s*['"]will-navigate['"]/)
  assert.match(mainSource, /will-navigate[\s\S]*?preventDefault\(\)/)
})
