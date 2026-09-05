import { useState } from 'react'
import './App.css'
import { DemoPage } from './ui/DemoPage'
import { ThemeProvider } from './ui/theme'
import { ToastProvider } from './ui/Toast'

function App() {
  const [pingResult, setPingResult] = useState<string>('')

  async function handlePing() {
    if (!window.api) {
      setPingResult(
        'Keine Electron-API verfügbar (Renderer läuft ohne Electron).',
      )
      return
    }

    const response = await window.api.ping({
      message: 'Hallo aus dem Renderer',
    })
    setPingResult(
      `${response.message} (${new Date(response.receivedAt).toLocaleTimeString()})`,
    )
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <main className="placeholder">
          <h1>irgendwastolles</h1>
          <p>Renderer-Grundstruktur bereit. Hier entsteht die Anwendung.</p>
          <button type="button" onClick={handlePing}>
            IPC-Testaufruf
          </button>
          {pingResult && <p>{pingResult}</p>}
        </main>
        <DemoPage />
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
