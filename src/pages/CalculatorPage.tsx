import { useState } from 'react'
import { DemoPage } from '../ui/DemoPage'

export function CalculatorPage() {
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
    <div className="page">
      <h1>Rechner</h1>
      <p>
        Hier entsteht der Rechner. Diese Ansicht ist aktuell ein Platzhalter.
      </p>
      <button type="button" onClick={handlePing}>
        IPC-Testaufruf
      </button>
      {pingResult && <p>{pingResult}</p>}
      <DemoPage />
    </div>
  )
}
