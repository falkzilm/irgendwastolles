import { useAppStore } from './index'
import type { AppState } from './types'
import { erstelleDefaultGamificationProfil } from './slices/gamificationSlice'
import type { GamificationProfile } from './slices/gamificationSlice'
import { MAX_VERLAUF_EINTRAEGE } from './slices/verlaufSlice'
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
  calculatorMode: AppState['calculatorMode']
  verlauf: AppState['verlauf']
  favoritenIds: AppState['favoritenIds']
  gamification: AppState['gamification']
}

export function selectPersistableState(state: AppState): PersistableState {
  return {
    theme: state.theme,
    angleMode: state.angleMode,
    calculatorMode: state.calculatorMode,
    verlauf: state.verlauf,
    favoritenIds: state.favoritenIds,
    gamification: state.gamification,
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

function isGamificationProfile(value: unknown): value is GamificationProfile {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<GamificationProfile>
  return (
    typeof candidate.xp === 'number' &&
    typeof candidate.level === 'number' &&
    typeof candidate.streak === 'number' &&
    typeof candidate.laengsterStreak === 'number' &&
    (candidate.letzterAktivitaetsTag === null ||
      typeof candidate.letzterAktivitaetsTag === 'string') &&
    Array.isArray(candidate.freigeschalteteAchievements) &&
    candidate.freigeschalteteAchievements.every(
      (id) => typeof id === 'string',
    ) &&
    typeof candidate.anzahlBerechnungen === 'number' &&
    typeof candidate.anzahlQuizRunden === 'number'
  )
}

function isPersistableState(value: unknown): value is PersistableState {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<PersistableState>
  return (
    (candidate.theme === 'light' || candidate.theme === 'dark') &&
    (candidate.angleMode === 'deg' || candidate.angleMode === 'rad') &&
    (candidate.calculatorMode === 'simple' ||
      candidate.calculatorMode === 'scientific') &&
    Array.isArray(candidate.verlauf) &&
    candidate.verlauf.every(isVerlaufEintrag) &&
    Array.isArray(candidate.favoritenIds) &&
    candidate.favoritenIds.every((id) => typeof id === 'string') &&
    isGamificationProfile(candidate.gamification)
  )
}

/**
 * Normalisiert geladene Rohdaten vor der Validierung, damit ältere,
 * schema-kompatible Dateien ohne `verlauf` (z. B. vor IRGENDWAST-26) oder
 * ohne `calculatorMode` (z. B. vor IRGENDWAST-25) oder ohne `favoritenIds`
 * (z. B. vor IRGENDWAST-33) oder ohne `gamification` (z. B. vor
 * IRGENDWAST-41) oder mit einem `gamification`-Profil ohne `laengsterStreak`
 * (z. B. vor IRGENDWAST-43) nicht komplett verworfen werden, und ein zu
 * langer Verlauf (über `MAX_VERLAUF_EINTRAEGE`) auf die neuesten Einträge
 * gekappt wird, statt die Slice-Begrenzung zu umgehen.
 */
function normalizePersistedData(value: unknown): unknown {
  if (typeof value !== 'object' || value === null) return value
  let candidate = value as Record<string, unknown>

  if (!('verlauf' in candidate)) {
    candidate = { ...candidate, verlauf: [] }
  }

  if (!('calculatorMode' in candidate)) {
    candidate = { ...candidate, calculatorMode: 'simple' }
  }

  if (!('favoritenIds' in candidate)) {
    candidate = { ...candidate, favoritenIds: [] }
  }

  if (!('gamification' in candidate)) {
    candidate = {
      ...candidate,
      gamification: erstelleDefaultGamificationProfil(),
    }
  }

  if (
    typeof candidate.gamification === 'object' &&
    candidate.gamification !== null &&
    !('laengsterStreak' in candidate.gamification)
  ) {
    const gamification = candidate.gamification as Record<string, unknown>
    candidate = {
      ...candidate,
      gamification: {
        ...gamification,
        laengsterStreak:
          typeof gamification.streak === 'number' ? gamification.streak : 0,
      },
    }
  }

  if (
    Array.isArray(candidate.verlauf) &&
    candidate.verlauf.length > MAX_VERLAUF_EINTRAEGE
  ) {
    candidate = {
      ...candidate,
      verlauf: candidate.verlauf.slice(0, MAX_VERLAUF_EINTRAEGE),
    }
  }

  return candidate
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
  const normalized = normalizePersistedData(response.data)

  if (isPersistableState(normalized)) {
    useAppStore.setState(normalized)
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
      next.calculatorMode === previous.calculatorMode &&
      next.verlauf === previous.verlauf &&
      next.favoritenIds === previous.favoritenIds &&
      next.gamification === previous.gamification
    ) {
      return
    }
    previous = next
    void window.api.savePersistedState({ data: next })
  })
}
