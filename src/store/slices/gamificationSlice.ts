import type { StateCreator } from 'zustand'
import type { AppState } from '../types'

/**
 * Basis-Einheit der Level-Kurve, siehe `xpSchwelleFuerLevel` (IRGENDWAST-42).
 * Siehe docs/state.md - IRGENDWAST-41/-42.
 */
export const XP_PRO_LEVEL_BASIS = 100

/**
 * Events sind der einzige Weg, das Gamification-Profil zu verändern (siehe
 * `recordEvent`). Weitere fachliche Aktionen (z. B. neue Quiz-Typen) werden
 * hier als zusätzlicher Event-Typ ergänzt statt den Profilzustand direkt zu
 * setzen.
 */
export type GamificationEvent =
  { type: 'calculation_done' } | { type: 'quiz_round_finished' }

/**
 * XP-Belohnung pro Event-Art (IRGENDWAST-42):
 * - `calculation_done` (5 XP): eine erfolgreiche Berechnung im Rechner. Ein
 *   triviales, beliebig oft wiederholbares Ereignis - dagegen deckelt
 *   `XP_FARM_DECKEL` die tägliche XP-Vergabe.
 * - `quiz_round_finished` (20 XP): eine abgeschlossene Quizrunde. Erfordert
 *   pro Aufruf eigenständigen Aufwand und ist daher ungedeckelt.
 */
const XP_BELOHNUNG: Record<GamificationEvent['type'], number> = {
  calculation_done: 5,
  quiz_round_finished: 20,
}

/**
 * Deckelung gegen Punktefarming (IRGENDWAST-42): pro Kalendertag wird für
 * eine Event-Art nur bis zu dieser Anzahl XP vergeben, danach zählt ein
 * weiteres Auslösen zwar noch für die fachlichen Zähler (z. B.
 * `anzahlBerechnungen`), bringt aber keine weiteren XP. Event-Arten ohne
 * Eintrag sind ungedeckelt, weil sie bereits durch den nötigen Aufwand
 * (z. B. eine ganze Quizrunde) gegen Farming geschützt sind.
 */
const XP_FARM_DECKEL: Partial<Record<GamificationEvent['type'], number>> = {
  calculation_done: 20,
}

export interface GamificationProfile {
  xp: number
  level: number
  /** XP, die ab dem aktuellen `xp`-Gesamtwert noch bis zum nächsten Level fehlen. */
  restXpBisNaechstesLevel: number
  streak: number
  /** ISO-Datum (`YYYY-MM-DD`) des letzten Events, oder `null` vor dem ersten Event. */
  letzterAktivitaetsTag: string | null
  freigeschalteteAchievements: string[]
  anzahlBerechnungen: number
  anzahlQuizRunden: number
  /**
   * Anzahl der XP-vergebenden Events je Event-Art am Tag von
   * `letzterAktivitaetsTag` - Grundlage für `XP_FARM_DECKEL`. Wird beim
   * ersten Event eines neuen Kalendertags zurückgesetzt.
   */
  xpEventsHeute: Partial<Record<GamificationEvent['type'], number>>
}

export interface GamificationSlice {
  gamification: GamificationProfile
  /**
   * Einziger Weg, das Gamification-Profil zu verändern: schreibt XP, Level,
   * Streak sowie die passenden Zähler abhängig vom Event-Typ fort (siehe
   * docs/state.md) und meldet zurück, ob das Event zu einem Level-Up
   * geführt hat.
   */
  recordEvent: (event: GamificationEvent) => { levelUp: boolean; level: number }
}

export function erstelleDefaultGamificationProfil(): GamificationProfile {
  return {
    xp: 0,
    level: 1,
    restXpBisNaechstesLevel: xpSchwelleFuerLevel(2),
    streak: 0,
    letzterAktivitaetsTag: null,
    freigeschalteteAchievements: [],
    anzahlBerechnungen: 0,
    anzahlQuizRunden: 0,
    xpEventsHeute: {},
  }
}

/**
 * Kumulative XP-Schwelle, ab der `level` erreicht ist (Level 1 ab 0 XP).
 * Die Kurve ist progressiv: von Level `n` zu `n + 1` werden
 * `XP_PRO_LEVEL_BASIS * n` XP benötigt - jedes weitere Level ist also
 * teurer als das vorherige.
 */
function xpSchwelleFuerLevel(level: number): number {
  return (XP_PRO_LEVEL_BASIS * (level - 1) * level) / 2
}

/**
 * Leitet Level und Rest-XP bis zum nächsten Level deterministisch aus dem
 * XP-Gesamtwert ab (IRGENDWAST-42).
 */
export function berechneLevelStand(
  xpGesamt: number,
): Pick<GamificationProfile, 'level' | 'restXpBisNaechstesLevel'> {
  let level = 1
  while (xpSchwelleFuerLevel(level + 1) <= xpGesamt) {
    level++
  }
  return {
    level,
    restXpBisNaechstesLevel: xpSchwelleFuerLevel(level + 1) - xpGesamt,
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

/**
 * Reine Vergabe-Regel (IRGENDWAST-42): übersetzt ein Event unter
 * Berücksichtigung von `XP_FARM_DECKEL` in einen XP-Zuwachs und schreibt
 * das Profil fort. Getrennt von der Store-Action, damit die Regeln isoliert
 * testbar sind.
 */
function fortgeschriebenesProfil(
  profil: GamificationProfile,
  event: GamificationEvent,
): { profil: GamificationProfile; levelUp: boolean } {
  const heute = heutigerTag()
  const zaehlerVorEvent =
    profil.letzterAktivitaetsTag === heute ? profil.xpEventsHeute : {}
  const bisherigeAnzahlHeute = zaehlerVorEvent[event.type] ?? 0

  const deckel = XP_FARM_DECKEL[event.type]
  const istGedeckelt = deckel !== undefined && bisherigeAnzahlHeute >= deckel
  const xpZuwachs = istGedeckelt ? 0 : XP_BELOHNUNG[event.type]

  const xp = profil.xp + xpZuwachs
  const levelStand = berechneLevelStand(xp)

  return {
    profil: {
      ...profil,
      xp,
      ...levelStand,
      streak: fortgeschriebenerStreak(profil, heute),
      letzterAktivitaetsTag: heute,
      anzahlBerechnungen:
        profil.anzahlBerechnungen + (event.type === 'calculation_done' ? 1 : 0),
      anzahlQuizRunden:
        profil.anzahlQuizRunden +
        (event.type === 'quiz_round_finished' ? 1 : 0),
      xpEventsHeute: {
        ...zaehlerVorEvent,
        [event.type]: bisherigeAnzahlHeute + 1,
      },
    },
    levelUp: levelStand.level > profil.level,
  }
}

export const createGamificationSlice: StateCreator<
  AppState,
  [],
  [],
  GamificationSlice
> = (set, get) => ({
  gamification: erstelleDefaultGamificationProfil(),

  recordEvent: (event) => {
    const { profil, levelUp } = fortgeschriebenesProfil(
      get().gamification,
      event,
    )
    set({ gamification: profil })
    return { levelUp, level: profil.level }
  },
})
