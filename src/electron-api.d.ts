import type { ElectronApi } from '../shared/ipc.ts'

declare global {
  interface Window {
    api: ElectronApi
  }
}

export {}
