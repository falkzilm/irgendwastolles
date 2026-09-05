import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {
  hydratePersistedState,
  subscribeToPersistState,
} from './store/persistence.ts'

async function bootstrap() {
  // Persistierte Store-Daten müssen vor dem ersten Render vorliegen, damit
  // die UI nicht kurz mit Defaults aufblitzt (siehe IRGENDWAST-13).
  await hydratePersistedState()
  subscribeToPersistState()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
