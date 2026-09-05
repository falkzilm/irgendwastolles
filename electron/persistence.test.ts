import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, test } from 'vitest'
import {
  CURRENT_SCHEMA_VERSION,
  loadPersistedState,
  migrateData,
  savePersistedState,
  type Migration,
} from './persistence.ts'

let storeFilePath: string

beforeEach(() => {
  const dir = mkdtempSync(join(tmpdir(), 'persistence-test-'))
  storeFilePath = join(dir, 'store.json')
})

afterEach(() => {
  // Die temporären Verzeichnisse werden bewusst nicht aufgeräumt - es
  // handelt sich um wenige, kleine Dateien im OS-Tempverzeichnis, und ein
  // Cleanup würde hier nur zusätzliche Fehlerquellen (z. B. Race Conditions
  // bei parallel laufenden Tests) einführen.
})

test('ohne vorhandene Datei liefert loadPersistedState die übergebenen Defaults', () => {
  const defaults = { theme: 'light', angleMode: 'deg' }

  const result = loadPersistedState(storeFilePath, defaults)

  assert.deepEqual(result, defaults)
  assert.equal(existsSync(storeFilePath), false)
})

test('savePersistedState schreibt die aktuelle Schema-Version, loadPersistedState liest sie zurück', () => {
  const data = { theme: 'dark', angleMode: 'rad' }

  savePersistedState(storeFilePath, data)
  const onDisk = JSON.parse(readFileSync(storeFilePath, 'utf8'))
  assert.equal(onDisk.version, CURRENT_SCHEMA_VERSION)
  assert.deepEqual(onDisk.data, data)

  const loaded = loadPersistedState(storeFilePath, { fallback: true })
  assert.deepEqual(loaded, data)
})

test('Store-Änderungen sind nach einem simulierten Neustart noch vorhanden', () => {
  savePersistedState(storeFilePath, { theme: 'dark', angleMode: 'rad' })

  // Ein "Neustart" lädt einfach erneut über denselben Dateipfad.
  const afterRestart = loadPersistedState(storeFilePath, {
    theme: 'light',
    angleMode: 'deg',
  })

  assert.deepEqual(afterRestart, { theme: 'dark', angleMode: 'rad' })
})

test('migrateData hebt eine Datei von Schema-Version n-1 auf die Zielversion an', () => {
  const legacyFile = { version: 1, data: { theme: 'dark' } }
  const migrations: Record<number, Migration> = {
    1: (data) => ({ ...(data as object), angleMode: 'deg' }),
  }

  const result = migrateData(legacyFile, migrations, 2)

  assert.deepEqual(result, {
    migrated: true,
    data: { theme: 'dark', angleMode: 'deg' },
  })
})

test('loadPersistedState wendet registrierte Migrationen automatisch bis zur aktuellen Version an', () => {
  writeFileSync(
    storeFilePath,
    JSON.stringify({ version: 0, data: { theme: 'dark' } }),
    'utf8',
  )
  const migrations: Record<number, Migration> = {
    0: (data) => ({ ...(data as object), angleMode: 'deg' }),
  }

  const result = loadPersistedState(
    storeFilePath,
    { theme: 'light', angleMode: 'deg' },
    migrations,
  )

  assert.deepEqual(result, { theme: 'dark', angleMode: 'deg' })
})

test('unbekannte (neuere) Schema-Version führt zum Fallback auf Defaults statt zum Absturz', () => {
  writeFileSync(
    storeFilePath,
    JSON.stringify({ version: 99, data: { theme: 'dark' } }),
    'utf8',
  )
  const defaults = { theme: 'light', angleMode: 'deg' }

  const result = loadPersistedState(storeFilePath, defaults)

  assert.deepEqual(result, defaults)
  // Die Datei bleibt unverändert - sie könnte von einer neueren App-Version
  // geschrieben worden sein und wird nicht durch ältere Defaults ersetzt.
  assert.equal(JSON.parse(readFileSync(storeFilePath, 'utf8')).version, 99)
})

test('fehlende Migration zur Zielversion führt zum Fallback auf Defaults statt zum Absturz', () => {
  writeFileSync(
    storeFilePath,
    JSON.stringify({ version: 0, data: { theme: 'dark' } }),
    'utf8',
  )
  const defaults = { theme: 'light', angleMode: 'deg' }

  const result = loadPersistedState(storeFilePath, defaults, {})

  assert.deepEqual(result, defaults)
})

test('beschädigtes JSON wird als .bak gesichert und die Originaldatei durch Defaults ersetzt', () => {
  writeFileSync(storeFilePath, '{ das ist kein valides JSON', 'utf8')
  const defaults = { theme: 'light', angleMode: 'deg' }

  const result = loadPersistedState(storeFilePath, defaults)

  assert.deepEqual(result, defaults)
  assert.equal(existsSync(`${storeFilePath}.bak`), true)
  assert.equal(
    readFileSync(`${storeFilePath}.bak`, 'utf8'),
    '{ das ist kein valides JSON',
  )
  const replaced = JSON.parse(readFileSync(storeFilePath, 'utf8'))
  assert.equal(replaced.version, CURRENT_SCHEMA_VERSION)
  assert.deepEqual(replaced.data, defaults)
})

test('Datei mit unerwarteter Form (kein { version, data }) wird ebenfalls gesichert und ersetzt', () => {
  writeFileSync(storeFilePath, JSON.stringify({ foo: 'bar' }), 'utf8')
  const defaults = { theme: 'light', angleMode: 'deg' }

  const result = loadPersistedState(storeFilePath, defaults)

  assert.deepEqual(result, defaults)
  assert.equal(existsSync(`${storeFilePath}.bak`), true)
  const replaced = JSON.parse(readFileSync(storeFilePath, 'utf8'))
  assert.deepEqual(replaced.data, defaults)
})
