import { useAppStore } from './index'
import type { AppState } from './types'
import {
  berechneLevelStand,
  erstelleDefaultGamificationProfil,
} from './slices/gamificationSlice'
import type { GamificationProfile } from './slices/gamificationSlice'
import { MAX_QUIZ_ERGEBNISSE } from './slices/quizSlice'
import type { QuizErgebnis } from './slices/quizSlice'
import { MAX_VERLAUF_EINTRAEGE } from './slices/verlaufSlice'
import type { VerlaufEintrag } from './slices/verlaufSlice'
import { DIFFICULTIES } from '../exercises'

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
  notificationsEnabled: AppState['notificationsEnabled']
  hudEnabled: AppState['hudEnabled']
  verlauf: AppState['verlauf']
  favoritenIds: AppState['favoritenIds']
  gamification: AppState['gamification']
  quizErgebnisse: AppState['quizErgebnisse']
  formelNutzung: AppState['formelNutzung']
}

export function selectPersistableState(state: AppState): PersistableState {
  return {
    theme: state.theme,
    angleMode: state.angleMode,
    calculatorMode: state.calculatorMode,
    notificationsEnabled: state.notificationsEnabled,
    hudEnabled: state.hudEnabled,
    verlauf: state.verlauf,
    favoritenIds: state.favoritenIds,
    gamification: state.gamification,
    quizErgebnisse: state.quizErgebnisse,
    formelNutzung: state.formelNutzung,
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
    typeof candidate.restXpBisNaechstesLevel === 'number' &&
    typeof candidate.streak === 'number' &&
    typeof candidate.laengsterStreak === 'number' &&
    (candidate.letzterAktivitaetsTag === null ||
      typeof candidate.letzterAktivitaetsTag === 'string') &&
    Array.isArray(candidate.freigeschalteteAchievements) &&
    candidate.freigeschalteteAchievements.every(
      (id) => typeof id === 'string',
    ) &&
    typeof candidate.achievementFreischaltDaten === 'object' &&
    candidate.achievementFreischaltDaten !== null &&
    Object.values(candidate.achievementFreischaltDaten).every(
      (datum) => typeof datum === 'string',
    ) &&
    typeof candidate.anzahlBerechnungen === 'number' &&
    typeof candidate.anzahlQuizRunden === 'number' &&
    typeof candidate.xpEventsHeute === 'object' &&
    candidate.xpEventsHeute !== null
  )
}

function isQuizErgebnis(value: unknown): value is QuizErgebnis {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<QuizErgebnis>
  return (
    typeof candidate.id === 'string' &&
    (DIFFICULTIES as readonly string[]).includes(candidate.difficulty ?? '') &&
    typeof candidate.anzahlAufgaben === 'number' &&
    typeof candidate.anzahlRichtig === 'number' &&
    typeof candidate.dauerMs === 'number' &&
    typeof candidate.timestamp === 'number'
  )
}

function isFormelNutzung(value: unknown): value is Record<string, number> {
  if (typeof value !== 'object' || value === null) return false
  return Object.values(value).every((anzahl) => typeof anzahl === 'number')
}

function isPersistableState(value: unknown): value is PersistableState {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<PersistableState>
  return (
    (candidate.theme === 'light' || candidate.theme === 'dark') &&
    (candidate.angleMode === 'deg' || candidate.angleMode === 'rad') &&
    (candidate.calculatorMode === 'simple' ||
      candidate.calculatorMode === 'scientific') &&
    typeof candidate.notificationsEnabled === 'boolean' &&
    typeof candidate.hudEnabled === 'boolean' &&
    Array.isArray(candidate.verlauf) &&
    candidate.verlauf.every(isVerlaufEintrag) &&
    Array.isArray(candidate.favoritenIds) &&
    candidate.favoritenIds.every((id) => typeof id === 'string') &&
    isGamificationProfile(candidate.gamification) &&
    Array.isArray(candidate.quizErgebnisse) &&
    candidate.quizErgebnisse.every(isQuizErgebnis) &&
    isFormelNutzung(candidate.formelNutzung)
  )
}

/**
 * Normalisiert geladene Rohdaten vor der Validierung, damit ältere,
 * schema-kompatible Dateien ohne `verlauf` (z. B. vor IRGENDWAST-26) oder
 * ohne `calculatorMode` (z. B. vor IRGENDWAST-25) oder ohne `favoritenIds`
 * (z. B. vor IRGENDWAST-33) oder ohne `quizErgebnisse` (z. B. vor
 * IRGENDWAST-38) oder ohne `gamification` (z. B. vor
 * IRGENDWAST-41) oder mit einem `gamification`-Profil ohne `laengsterStreak`
 * (z. B. vor IRGENDWAST-43) oder ohne `achievementFreischaltDaten` (z. B. vor
 * IRGENDWAST-48) oder ohne `notificationsEnabled` (z. B. vor
 * IRGENDWAST-46) oder ohne `hudEnabled` (z. B. vor IRGENDWAST-47) nicht
 * komplett verworfen werden, und ein zu
 * langer Verlauf (über `MAX_VERLAUF_EINTRAEGE`) bzw. eine zu lange
 * Quiz-Ergebnisliste (über `MAX_QUIZ_ERGEBNISSE`) auf die neuesten Einträge
 * gekappt wird, statt die Slice-Begrenzung zu umgehen. Fehlt `formelNutzung`
 * (z. B. vor IRGENDWAST-49), wird ein leeres Objekt ergänzt. Ein vorhandenes
 * `gamification` ohne `restXpBisNaechstesLevel`/`xpEventsHeute` (z. B. vor
 * IRGENDWAST-42) wird um `xpEventsHeute` ergänzt; `level` und
 * `restXpBisNaechstesLevel` werden dabei aus `xp` neu berechnet statt das
 * persistierte `level` beizubehalten, da dieses noch von der alten,
 * linearen Kurve stammen kann und dann nicht mehr zu `xp` passen würde.
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

  if (!('notificationsEnabled' in candidate)) {
    candidate = { ...candidate, notificationsEnabled: true }
  }

  if (!('hudEnabled' in candidate)) {
    candidate = { ...candidate, hudEnabled: true }
  }

  if (!('favoritenIds' in candidate)) {
    candidate = { ...candidate, favoritenIds: [] }
  }

  if (!('quizErgebnisse' in candidate)) {
    candidate = { ...candidate, quizErgebnisse: [] }
  }

  if (!('formelNutzung' in candidate)) {
    candidate = { ...candidate, formelNutzung: {} }
  }

  if (!('gamification' in candidate)) {
    candidate = {
      ...candidate,
      gamification: erstelleDefaultGamificationProfil(),
    }
  } else if (
    typeof candidate.gamification === 'object' &&
    candidate.gamification !== null
  ) {
    const gamification = candidate.gamification as Record<string, unknown>
    if (
      !('restXpBisNaechstesLevel' in gamification) ||
      !('xpEventsHeute' in gamification)
    ) {
      const xp = typeof gamification.xp === 'number' ? gamification.xp : 0
      candidate = {
        ...candidate,
        gamification: {
          ...gamification,
          ...berechneLevelStand(xp),
          xpEventsHeute: gamification.xpEventsHeute ?? {},
        },
      }
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
    typeof candidate.gamification === 'object' &&
    candidate.gamification !== null &&
    !('achievementFreischaltDaten' in candidate.gamification)
  ) {
    const gamification = candidate.gamification as Record<string, unknown>
    candidate = {
      ...candidate,
      gamification: {
        ...gamification,
        achievementFreischaltDaten: {},
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

  if (
    Array.isArray(candidate.quizErgebnisse) &&
    candidate.quizErgebnisse.length > MAX_QUIZ_ERGEBNISSE
  ) {
    candidate = {
      ...candidate,
      quizErgebnisse: candidate.quizErgebnisse.slice(0, MAX_QUIZ_ERGEBNISSE),
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
      next.notificationsEnabled === previous.notificationsEnabled &&
      next.hudEnabled === previous.hudEnabled &&
      next.verlauf === previous.verlauf &&
      next.favoritenIds === previous.favoritenIds &&
      next.gamification === previous.gamification &&
      next.quizErgebnisse === previous.quizErgebnisse &&
      next.formelNutzung === previous.formelNutzung
    ) {
      return
    }
    previous = next
    void window.api.savePersistedState({ data: next })
  })
}
