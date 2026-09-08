import type { StateCreator } from 'zustand'
import type { AppState } from '../types'

/** Siehe docs/state.md - IRGENDWAST-41. */
export const XP_PRO_LEVEL = 100

/**
 * Events sind der einzige Weg, das Gamification-Profil zu verändern (siehe
 * `recordEvent`). Weitere fachliche Aktionen (z. B. neue Quiz-Typen) werden
 * hier als zusätzlicher Event-Typ ergänzt statt den Profilzustand direkt zu
 * setzen.
 */
export type GamificationEvent =
  { type: 'calculation_done' } | { type: 'quiz_round_finished' }

const XP_BELOHNUNG: Record<GamificationEvent['type'], number> = {
  calculation_done: 5,
  quiz_round_finished: 20,
}

export interface GamificationProfile {
  xp: number
  level: number
  streak: number
  /** ISO-Datum (`YYYY-MM-DD`) des letzten Events, oder `null` vor dem ersten Event. */
  letzterAktivitaetsTag: string | null
  freigeschalteteAchievements: string[]
  anzahlBerechnungen: number
  anzahlQuizRunden: number
}

export interface GamificationSlice {
  gamification: GamificationProfile
  /**
   * Einziger Weg, das Gamification-Profil zu verändern: schreibt XP, Level,
   * Streak sowie die passenden Zähler abhängig vom Event-Typ fort (siehe
   * docs/state.md).
   */
  recordEvent: (event: GamificationEvent) => void
}

export function erstelleDefaultGamificationProfil(): GamificationProfile {
  return {
    xp: 0,
    level: 1,
    streak: 0,
    letzterAktivitaetsTag: null,
    freigeschalteteAchievements: [],
    anzahlBerechnungen: 0,
    anzahlQuizRunden: 0,
  }
}

function heutigerTag(): string {
  return new Date().toISOString().slice(0, 10)
}

function vorherigerTag(tag: string): string {
  const datum = new Date(`${tag}T00:00:00.000Z`)
  datum.setUTCDate(datum.getUTCDate() - 1)
  return datum.toISOString().slice(0, 10)
}

/**
 * Ein Event am selben Tag lässt den Streak unverändert, eines am
 * Folgetag erhöht ihn um eins, ein größerer Abstand (oder das erste
 * Event überhaupt) setzt ihn auf 1 zurück.
 */
function fortgeschriebenerStreak(
  profil: GamificationProfile,
  heute: string,
): number {
  if (profil.letzterAktivitaetsTag === heute) return profil.streak
  if (profil.letzterAktivitaetsTag === vorherigerTag(heute)) {
    return profil.streak + 1
  }
  return 1
}

export const createGamificationSlice: StateCreator<
  AppState,
  [],
  [],
  GamificationSlice
> = (set) => ({
  gamification: erstelleDefaultGamificationProfil(),

  recordEvent: (event) =>
    set((state) => {
      const profil = state.gamification
      const heute = heutigerTag()
      const xp = profil.xp + XP_BELOHNUNG[event.type]

      return {
        gamification: {
          ...profil,
          xp,
          level: Math.floor(xp / XP_PRO_LEVEL) + 1,
          streak: fortgeschriebenerStreak(profil, heute),
          letzterAktivitaetsTag: heute,
          anzahlBerechnungen:
            profil.anzahlBerechnungen +
            (event.type === 'calculation_done' ? 1 : 0),
          anzahlQuizRunden:
            profil.anzahlQuizRunden +
            (event.type === 'quiz_round_finished' ? 1 : 0),
        },
      }
    }),
})
