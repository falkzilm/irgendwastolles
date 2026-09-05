/**
 * Gemeinsame IPC-Vertragsdefinitionen für Main- und Renderer-Prozess.
 * Wird sowohl von `electron/main.ts` und `electron/preload.ts` (Node/Electron-Kontext)
 * als auch vom Renderer (`src/`) importiert, damit Kanalnamen und Payload-Typen
 * an keiner Stelle auseinanderlaufen können.
 */

export const IPC_CHANNELS = {
  PING: 'app:ping',
  // Platzhalter für zukünftige Persistenz-Kanäle
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

// Platzhalter-Typen für zukünftige Persistenz-Kanäle
export interface StoreGetRequest {
  key: string
}

export type StoreGetResponse = unknown

export interface StoreSetRequest {
  key: string
  value: unknown
}

export type StoreSetResponse = void

export interface ElectronApi {
  ping(request: PingRequest): Promise<PingResponse>
}
