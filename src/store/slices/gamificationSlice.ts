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
  /** Der höchste je erreichte Streak-Wert, unabhängig vom aktuellen `streak`. */
  laengsterStreak: number
  /** Lokales Kalenderdatum (`YYYY-MM-DD`) des letzten Events, oder `null` vor dem ersten Event. */
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
   * docs/state.md). `jetzt` ist die Zeitquelle für den Streak (Default: die
   * aktuelle Systemzeit) und in Tests injizierbar, damit Tageswechsel und
   * Zeitzonenwechsel ohne globales Mocken der Systemzeit geprüft werden
   * können.
   */
  recordEvent: (event: GamificationEvent, jetzt?: Date) => void
}

export function erstelleDefaultGamificationProfil(): GamificationProfile {
  return {
    xp: 0,
    level: 1,
    streak: 0,
    laengsterStreak: 0,
    letzterAktivitaetsTag: null,
    freigeschalteteAchievements: [],
    anzahlBerechnungen: 0,
    anzahlQuizRunden: 0,
  }
}

/**
 * Lokaler Kalendertag (nicht UTC) als `YYYY-MM-DD`. Verwendet die
 * lokalen `Date`-Komponenten statt `toISOString()`, damit der Streak den
 * Kalendertag am tatsächlichen Aufenthaltsort abbildet und nicht durch die
 * UTC-Verschiebung um Mitternacht springt.
 */
function lokalerTag(jetzt: Date): string {
  const jahr = jetzt.getFullYear()
  const monat = String(jetzt.getMonth() + 1).padStart(2, '0')
  const tag = String(jetzt.getDate()).padStart(2, '0')
  return `${jahr}-${monat}-${tag}`
}

/**
 * Kalendertag vor `tag`, per lokaler Datumsarithmetik (nicht über UTC-
 * Subtraktion), damit das Ergebnis auch bei einem Zeitzonen- oder
 * Uhrumstellung (z. B. Sommer-/Winterzeit) der tatsächliche vorherige
 * lokale Kalendertag bleibt.
 */
function vorherigerTag(tag: string): string {
  const [jahr, monat, tagZahl] = tag.split('-').map(Number)
  return lokalerTag(new Date(jahr, monat - 1, tagZahl - 1))
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

/**
 * Erkennt einen lokalen Kalendertag, der vor dem zuletzt gespeicherten
 * Aktivitätstag liegt (z. B. durch Reisen nach Westen über die Datumsgrenze
 * oder eine manuelle Uhrkorrektur). String-Vergleich genügt, da
 * `letzterAktivitaetsTag` stets im Format `YYYY-MM-DD` vorliegt und dieses
 * Format lexikografisch chronologisch sortiert ist.
 */
function istVorLetzterAktivitaet(
  profil: GamificationProfile,
  heute: string,
): boolean {
  return (
    profil.letzterAktivitaetsTag !== null &&
    heute < profil.letzterAktivitaetsTag
  )
}

export const createGamificationSlice: StateCreator<
  AppState,
  [],
  [],
  GamificationSlice
> = (set) => ({
  gamification: erstelleDefaultGamificationProfil(),

  recordEvent: (event, jetzt = new Date()) =>
    set((state) => {
      const profil = state.gamification
      const heute = lokalerTag(jetzt)
      const xp = profil.xp + XP_BELOHNUNG[event.type]
      // Ein Tag vor dem gespeicherten Aktivitätstag (Zeitzonen-/Uhrsprung
      // rückwärts) darf den Marker nicht zurückbewegen und den Streak weder
      // erhöhen noch zurücksetzen - der spätere Tag wurde bereits gezählt.
      const rueckwaertsspringenderTag = istVorLetzterAktivitaet(profil, heute)
      const streak = rueckwaertsspringenderTag
        ? profil.streak
        : fortgeschriebenerStreak(profil, heute)

      return {
        gamification: {
          ...profil,
          xp,
          level: Math.floor(xp / XP_PRO_LEVEL) + 1,
          streak,
          laengsterStreak: Math.max(profil.laengsterStreak, streak),
          letzterAktivitaetsTag: rueckwaertsspringenderTag
            ? profil.letzterAktivitaetsTag
            : heute,
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
