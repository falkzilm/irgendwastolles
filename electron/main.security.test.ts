/**
 * Bewacht die in docs/security.md dokumentierten Härtungsmaßnahmen für den
 * Main-Prozess.
 *
 * Die eigentliche CSP-/Navigations-Logik lebt in `electron/security.ts` und
 * ist von der Electron-Runtime entkoppelt (siehe dort) – sie wird hier direkt
 * importiert und mit Fake-Objekten aufgerufen, sodass das tatsächliche
 * Verhalten (welcher Header gesetzt wird, dass Navigation wirklich
 * abgebrochen wird) geprüft wird statt nur das Vorhandensein von Strings.
 *
 * Die Verdrahtung in `electron/main.ts` (welche Funktion mit welchen
 * Argumenten aufgerufen wird) kann mangels echter Electron-Runtime im Test
 * nicht durch Import geprüft werden und wird deshalb ergänzend statisch am
 * Quellcode verifiziert.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  applyContentSecurityPolicy,
  blockNavigation,
  CONTENT_SECURITY_POLICY,
  denyWindowOpen,
  type HeadersReceivedDetails,
  type HeadersReceivedResponse,
  type WebRequestLike,
} from './security.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const mainSource = readFileSync(join(__dirname, 'main.ts'), 'utf8')

test('BrowserWindow wird mit contextIsolation, ohne nodeIntegration und mit sandbox erzeugt', () => {
  assert.match(mainSource, /contextIsolation:\s*true/)
  assert.match(mainSource, /nodeIntegration:\s*false/)
  assert.match(mainSource, /sandbox:\s*true/)
})

test('applyContentSecurityPolicy registriert einen restriktiven Content-Security-Policy-Header', () => {
  const captured: { onHeadersReceivedCalled: boolean; response: HeadersReceivedResponse | null } = {
    onHeadersReceivedCalled: false,
    response: null,
  }
  const fakeWebRequest: WebRequestLike = {
    onHeadersReceived(listener) {
      captured.onHeadersReceivedCalled = true
      const details: HeadersReceivedDetails = { responseHeaders: { 'X-Existing': ['keep-me'] } }
      listener(details, (result) => {
        captured.response = result
      })
    },
  }

  applyContentSecurityPolicy(fakeWebRequest)

  assert.ok(captured.onHeadersReceivedCalled, 'onHeadersReceived wurde nicht aufgerufen')
  assert.ok(captured.response, 'der onHeadersReceived-Callback wurde nicht mit einer Antwort aufgerufen')
  const headers = captured.response.responseHeaders
  assert.deepEqual(headers['X-Existing'], ['keep-me'])
  assert.ok(Array.isArray(headers['Content-Security-Policy']))
  const [policy] = headers['Content-Security-Policy']
  assert.equal(policy, CONTENT_SECURITY_POLICY)
  assert.match(policy, /(^|; )default-src 'self'(;|$)/)
  assert.match(policy, /(^|; )script-src 'self'(;|$)/)
  assert.match(policy, /(^|; )object-src 'none'(;|$)/)
})

test('main.ts wendet die CSP im Produktions-Build auf die echte Electron-Session an', () => {
  assert.match(mainSource, /if\s*\(\s*!DEV_SERVER_URL\s*\)\s*{[\s\S]*?applyContentSecurityPolicy\(/)
  assert.match(mainSource, /applyContentSecurityPolicy\(\s*session\.defaultSession\.webRequest\s*\)/)
})

test('neue Fenster (window.open) werden abgelehnt', () => {
  assert.deepEqual(denyWindowOpen(), { action: 'deny' })
  assert.match(mainSource, /setWindowOpenHandler\(\s*denyWindowOpen\s*\)/)
})

test('Navigationsversuche werden abgefangen', () => {
  let prevented = false
  blockNavigation({ preventDefault: () => (prevented = true) })
  assert.equal(prevented, true)
  assert.match(mainSource, /\.on\(\s*['"]will-navigate['"]\s*,\s*blockNavigation\s*\)/)
})
