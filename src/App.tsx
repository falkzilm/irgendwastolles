import { useState } from 'react'
import './App.css'

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
    <main className="placeholder">
      <h1>irgendwastolles</h1>
      <p>Renderer-Grundstruktur bereit. Hier entsteht die Anwendung.</p>
      <button type="button" onClick={handlePing}>
        IPC-Testaufruf
      </button>
      {pingResult && <p>{pingResult}</p>}
    </main>
  )
}

export default App
