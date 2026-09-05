import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS, type ElectronApi, type PingRequest, type PingResponse } from '../shared/ipc.ts'

const api: ElectronApi = {
  ping: (request: PingRequest) => ipcRenderer.invoke(IPC_CHANNELS.PING, request) as Promise<PingResponse>,
}

contextBridge.exposeInMainWorld('api', api)
