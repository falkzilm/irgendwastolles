import { app, BrowserWindow, ipcMain, session } from 'electron'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  IPC_CHANNELS,
  type PersistenceLoadRequest,
  type PersistenceLoadResponse,
  type PersistenceSaveRequest,
  type PersistenceSaveResponse,
  type PingRequest,
  type PingResponse,
} from '../shared/ipc.ts'
import { loadPersistedState, savePersistedState } from './persistence.ts'
import {
  applyContentSecurityPolicy,
  blockNavigation,
  denyWindowOpen,
} from './security.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))

const RENDERER_DIST = join(__dirname, '../dist')
const PRELOAD_PATH = join(__dirname, 'preload.mjs')

const STORE_FILE_PATH = join(app.getPath('userData'), 'store.json')

const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  // Blockiert window.open()/target="_blank" vollständig. Offene Frage laut Ticket:
  // ob externe Links (z.B. Quellenangaben) im System-Browser geöffnet werden dürfen
  // ist ungeklärt – bis dahin werden neue Fenster grundsätzlich unterbunden.
  win.webContents.setWindowOpenHandler(denyWindowOpen)

  // `will-navigate` feuert nicht bei den programmatischen `loadURL`/`loadFile`-Aufrufen
  // unten, sondern nur bei Navigationsversuchen aus der Seite heraus (Linkklicks,
  // `window.location`-Änderungen etc.). Da die App keine Navigation innerhalb der
  // WebContents benötigt, wird jeder solche Versuch im Main-Prozess abgefangen.
  win.webContents.on('will-navigate', blockNavigation)

  if (DEV_SERVER_URL) {
    win.loadURL(DEV_SERVER_URL)
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

ipcMain.handle(
  IPC_CHANNELS.STORE_GET,
  (_event, request: PersistenceLoadRequest): PersistenceLoadResponse => {
    return { data: loadPersistedState(STORE_FILE_PATH, request.defaults) }
  },
)

ipcMain.handle(
  IPC_CHANNELS.STORE_SET,
  (_event, request: PersistenceSaveRequest): PersistenceSaveResponse => {
    savePersistedState(STORE_FILE_PATH, request.data)
  },
)

app.whenReady().then(() => {
  // Restriktive CSP für den Produktions-Build (siehe docs/security.md). Im Dev-Modus
  // bräuchte Vites HMR-Client u.a. 'unsafe-eval' und eine WebSocket-Verbindung, daher
  // bleibt der Header dort deaktiviert.
  if (!DEV_SERVER_URL) {
    applyContentSecurityPolicy(session.defaultSession.webRequest)
  }

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
