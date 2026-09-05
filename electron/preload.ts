import { contextBridge, ipcRenderer } from 'electron'
import {
  IPC_CHANNELS,
  type ElectronApi,
  type PersistenceLoadRequest,
  type PersistenceLoadResponse,
  type PersistenceSaveRequest,
  type PersistenceSaveResponse,
  type PingRequest,
  type PingResponse,
} from '../shared/ipc.ts'

const api: ElectronApi = {
  ping: (request: PingRequest) =>
    ipcRenderer.invoke(IPC_CHANNELS.PING, request) as Promise<PingResponse>,
  loadPersistedState: (request: PersistenceLoadRequest) =>
    ipcRenderer.invoke(
      IPC_CHANNELS.STORE_GET,
      request,
    ) as Promise<PersistenceLoadResponse>,
  savePersistedState: (request: PersistenceSaveRequest) =>
    ipcRenderer.invoke(
      IPC_CHANNELS.STORE_SET,
      request,
    ) as Promise<PersistenceSaveResponse>,
}

contextBridge.exposeInMainWorld('api', api)
