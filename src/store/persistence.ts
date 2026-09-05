import { useAppStore } from './index'
import type { AppState } from './types'
import type { VerlaufEintrag } from './slices/verlaufSlice'

/**
 * Anteil des Stores, der über IPC persistiert wird - nur reine Daten, keine
 * Actions (die sind ohnehin nicht JSON-serialisierbar). Neue fachliche
 * Slices ergänzen ihre zu persistierenden Felder hier sowie in
 * `isPersistableState`, siehe docs/state.md.
 */
export interface PersistableState {
  theme: AppState['theme']
  angleMode: AppState['angleMode']
  verlauf: AppState['verlauf']
}

export function selectPersistableState(state: AppState): PersistableState {
  return {
    theme: state.theme,
    angleMode: state.angleMode,
    verlauf: state.verlauf,
  }
}

function isVerlaufEintrag(value: unknown): value is VerlaufEintrag {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<VerlaufEintrag>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.expression === 'string' &&
    typeof candidate.result === 'string' &&
    typeof candidate.timestamp === 'number'
  )
}

function isPersistableState(value: unknown): value is PersistableState {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<PersistableState>
  return (
    (candidate.theme === 'light' || candidate.theme === 'dark') &&
    (candidate.angleMode === 'deg' || candidate.angleMode === 'rad') &&
    Array.isArray(candidate.verlauf) &&
    candidate.verlauf.every(isVerlaufEintrag)
  )
}

/**
 * Lädt beim App-Start den persistierten Store-Anteil über IPC und
 * übernimmt ihn in den Store. Ohne Electron-API (z. B. im reinen
 * Browser-Dev-Server via `npm run dev`) oder ohne gültige gespeicherte
 * Daten bleiben die Store-Defaults erhalten.
 */
export async function hydratePersistedState(): Promise<void> {
  if (!window.api) return

  const defaults = selectPersistableState(useAppStore.getState())
  const response = await window.api.loadPersistedState({ defaults })

  if (isPersistableState(response.data)) {
    useAppStore.setState(response.data)
  }
}

/**
 * Speichert den persistierbaren Store-Anteil über IPC, sobald er sich
 * ändert. Gibt eine Unsubscribe-Funktion zurück (siehe `useAppStore.subscribe`).
 */
export function subscribeToPersistState(): () => void {
  if (!window.api) return () => {}

  let previous = selectPersistableState(useAppStore.getState())

  return useAppStore.subscribe((state) => {
    const next = selectPersistableState(state)
    if (
      next.theme === previous.theme &&
      next.angleMode === previous.angleMode &&
      next.verlauf === previous.verlauf
    ) {
      return
    }
    previous = next
    void window.api.savePersistedState({ data: next })
  })
}
