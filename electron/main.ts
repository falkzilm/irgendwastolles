import { app, BrowserWindow, ipcMain } from 'electron'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  IPC_CHANNELS,
  type PingRequest,
  type PingResponse,
} from '../shared/ipc.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))

const RENDERER_DIST = join(__dirname, '../dist')
const PRELOAD_PATH = join(__dirname, 'preload.mjs')

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(join(RENDERER_DIST, 'index.html'))
  }

  return win
}

ipcMain.handle(
  IPC_CHANNELS.PING,
  (_event, request: PingRequest): PingResponse => {
    return {
      message: `pong: ${request.message}`,
      receivedAt: Date.now(),
    }
  },
)

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
