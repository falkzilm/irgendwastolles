/**
 * Versionierte Persistenz des Store-Anteils als JSON-Datei im
 * userData-Verzeichnis (siehe `electron/main.ts` für die Verdrahtung über
 * IPC). Von der Electron-Runtime entkoppelt (nur `node:fs`/`node:path`),
 * damit `persistence.test.ts` sie ohne echte Electron-Instanz direkt gegen
 * ein temporäres Verzeichnis testen kann – analog zu `electron/security.ts`.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { dirname } from 'node:path'

export const CURRENT_SCHEMA_VERSION = 1

export interface PersistedFile {
  version: number
  data: unknown
}

/**
 * Migrationshook: `migrations[v]` hebt den `data`-Teil einer Datei von
 * Schema-Version `v` auf `v + 1` an. Ein künftiger Versionssprung ergänzt
 * hier lediglich einen weiteren Eintrag; `migrateData` wendet sie
 * nacheinander an, bis die Zielversion erreicht ist.
 */
export type Migration = (data: unknown) => unknown

export const MIGRATIONS: Record<number, Migration> = {}

export type MigrationResult =
  { migrated: true; data: unknown } | { migrated: false }

export function migrateData(
  file: PersistedFile,
  migrations: Record<number, Migration> = MIGRATIONS,
  targetVersion: number = CURRENT_SCHEMA_VERSION,
): MigrationResult {
  let { version } = file
  let { data } = file

  if (version > targetVersion) {
    // Datei stammt aus einer neueren, hier unbekannten App-Version.
    return { migrated: false }
  }

  while (version < targetVersion) {
    const step = migrations[version]
    if (!step) return { migrated: false }
    data = step(data)
    version += 1
  }

  return { migrated: true, data }
}

function isPersistedFile(value: unknown): value is PersistedFile {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>).version === 'number' &&
    'data' in value
  )
}

function writePersistedFile(filePath: string, data: unknown): void {
  const file: PersistedFile = { version: CURRENT_SCHEMA_VERSION, data }
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, JSON.stringify(file, null, 2), 'utf8')
}

function backupAndReplaceWithDefaults(filePath: string, defaults: unknown) {
  try {
    copyFileSync(filePath, `${filePath}.bak`)
  } catch {
    // Backup ist best effort - ein fehlgeschlagenes Backup darf den
    // Fallback auf Defaults nicht verhindern.
  }
  writePersistedFile(filePath, defaults)
}

/**
 * Lädt den persistierten Store-Anteil. Fälle ohne lauffähige Daten liefern
 * jeweils `defaults` zurück, statt einen Fehler zu werfen:
 * - Datei existiert nicht (z. B. erster App-Start).
 * - Datei ist kein valides JSON bzw. hat nicht die erwartete Form
 *   (`{ version, data }`) - zusätzlich wird sie als `.bak` gesichert und
 *   durch die Defaults ersetzt.
 * - Schema-Version ist neuer als `CURRENT_SCHEMA_VERSION` oder es fehlt
 *   eine Migration zur aktuellen Version.
 */
export function loadPersistedState(
  filePath: string,
  defaults: unknown,
  migrations: Record<number, Migration> = MIGRATIONS,
): unknown {
  if (!existsSync(filePath)) return defaults

  let raw: string
  try {
    raw = readFileSync(filePath, 'utf8')
  } catch {
    return defaults
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    backupAndReplaceWithDefaults(filePath, defaults)
    return defaults
  }

  if (!isPersistedFile(parsed)) {
    backupAndReplaceWithDefaults(filePath, defaults)
    return defaults
  }

  const result = migrateData(parsed, migrations)
  return result.migrated ? result.data : defaults
}

export function savePersistedState(filePath: string, data: unknown): void {
  writePersistedFile(filePath, data)
}
