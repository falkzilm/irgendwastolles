/**
 * Gemeinsame IPC-Vertragsdefinitionen für Main- und Renderer-Prozess.
 * Wird sowohl von `electron/main.ts` und `electron/preload.ts` (Node/Electron-Kontext)
 * als auch vom Renderer (`src/`) importiert, damit Kanalnamen und Payload-Typen
 * an keiner Stelle auseinanderlaufen können.
 */

export const IPC_CHANNELS = {
  PING: 'app:ping',
  STORE_GET: 'persistence:get',
  STORE_SET: 'persistence:set',
} as const

export interface PingRequest {
  message: string
}

export interface PingResponse {
  message: string
  receivedAt: number
}

/**
 * `defaults` wird mitgeschickt, damit der Main-Prozess eine beschädigte
 * Datei direkt durch die Renderer-Defaults ersetzen kann, ohne deren Form
 * kennen zu müssen (siehe `electron/persistence.ts`).
 */
export interface PersistenceLoadRequest {
  defaults: unknown
}

export interface PersistenceLoadResponse {
  data: unknown
}

export interface PersistenceSaveRequest {
  data: unknown
}

export type PersistenceSaveResponse = void

export interface ElectronApi {
  ping(request: PingRequest): Promise<PingResponse>
  loadPersistedState(
    request: PersistenceLoadRequest,
  ): Promise<PersistenceLoadResponse>
  savePersistedState(
    request: PersistenceSaveRequest,
  ): Promise<PersistenceSaveResponse>
}
