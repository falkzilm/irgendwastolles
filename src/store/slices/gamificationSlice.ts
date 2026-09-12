import type { StateCreator } from 'zustand'
import { ermittleNeueAchievements } from '../../achievements/evaluate'
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
  /** Der höchste je erreichte Streak-Wert, unabhängig vom aktuellen `streak`. */
  laengsterStreak: number
  /** Lokales Kalenderdatum (`YYYY-MM-DD`) des letzten Events, oder `null` vor dem ersten Event. */
  letzterAktivitaetsTag: string | null
  freigeschalteteAchievements: string[]
  /** ISO-Zeitstempel des Freischaltens je Achievement-`id`, für die Anzeige des Freischaltdatums (IRGENDWAST-48). */
  achievementFreischaltDaten: Record<string, string>
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
   * Streak sowie die passenden Zähler abhängig vom Event-Typ fort und trägt
   * anschließend neu erfüllte Achievements (siehe `ermittleNeueAchievements`
   * in `src/achievements/evaluate.ts`) in `freigeschalteteAchievements` ein,
   * damit sie nicht erneut ausgelöst werden (siehe docs/state.md). `jetzt`
   * ist die Zeitquelle für den Streak (Default: die aktuelle Systemzeit) und
   * in Tests injizierbar, damit Tageswechsel und Zeitzonenwechsel ohne
   * globales Mocken der Systemzeit geprüft werden können. Meldet zurück, ob
   * das Event zu einem Level-Up geführt hat.
   */
  recordEvent: (
    event: GamificationEvent,
    jetzt?: Date,
  ) => { levelUp: boolean; level: number }
}

export function erstelleDefaultGamificationProfil(): GamificationProfile {
  return {
    xp: 0,
    level: 1,
    restXpBisNaechstesLevel: xpSchwelleFuerLevel(2),
    streak: 0,
    laengsterStreak: 0,
    letzterAktivitaetsTag: null,
    freigeschalteteAchievements: [],
    achievementFreischaltDaten: {},
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

/**
 * Anteil (0..1) des aktuellen Levels, der bereits per XP erreicht wurde -
 * Grundlage des XP-Fortschrittsbalkens im HUD (IRGENDWAST-47). Die für das
 * aktuelle Level benötigte XP-Menge ist `XP_PRO_LEVEL_BASIS * level` (siehe
 * `xpSchwelleFuerLevel`), der bereits verbrauchte Anteil ergibt sich daraus
 * als Gegenstück zu `restXpBisNaechstesLevel`.
 */
export function berechneXpFortschritt(
  profil: Pick<GamificationProfile, 'level' | 'restXpBisNaechstesLevel'>,
): number {
  const xpFuerLevel = XP_PRO_LEVEL_BASIS * profil.level
  return 1 - profil.restXpBisNaechstesLevel / xpFuerLevel
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

/**
 * Reine Vergabe-Regel (IRGENDWAST-42): übersetzt ein Event unter
 * Berücksichtigung von `XP_FARM_DECKEL` in einen XP-Zuwachs, schreibt Level,
 * Rest-XP, Streak und Achievements fort. Getrennt von der Store-Action,
 * damit die Regeln isoliert testbar sind.
 */
function fortgeschriebenesProfil(
  profil: GamificationProfile,
  event: GamificationEvent,
  jetzt: Date,
): { profil: GamificationProfile; levelUp: boolean } {
  const heute = lokalerTag(jetzt)
  const zaehlerVorEvent =
    profil.letzterAktivitaetsTag === heute ? profil.xpEventsHeute : {}
  const bisherigeAnzahlHeute = zaehlerVorEvent[event.type] ?? 0

  const deckel = XP_FARM_DECKEL[event.type]
  const istGedeckelt = deckel !== undefined && bisherigeAnzahlHeute >= deckel
  const xpZuwachs = istGedeckelt ? 0 : XP_BELOHNUNG[event.type]

  const xp = profil.xp + xpZuwachs
  const levelStand = berechneLevelStand(xp)

  // Ein Tag vor dem gespeicherten Aktivitätstag (Zeitzonen-/Uhrsprung
  // rückwärts) darf den Marker nicht zurückbewegen und den Streak weder
  // erhöhen noch zurücksetzen - der spätere Tag wurde bereits gezählt.
  const rueckwaertsspringenderTag = istVorLetzterAktivitaet(profil, heute)
  const streak = rueckwaertsspringenderTag
    ? profil.streak
    : fortgeschriebenerStreak(profil, heute)

  const fortgeschrieben: GamificationProfile = {
    ...profil,
    xp,
    ...levelStand,
    streak,
    laengsterStreak: Math.max(profil.laengsterStreak, streak),
    letzterAktivitaetsTag: rueckwaertsspringenderTag
      ? profil.letzterAktivitaetsTag
      : heute,
    anzahlBerechnungen:
      profil.anzahlBerechnungen + (event.type === 'calculation_done' ? 1 : 0),
    anzahlQuizRunden:
      profil.anzahlQuizRunden + (event.type === 'quiz_round_finished' ? 1 : 0),
    xpEventsHeute: {
      ...zaehlerVorEvent,
      [event.type]: bisherigeAnzahlHeute + 1,
    },
  }

  const neueAchievements = ermittleNeueAchievements(fortgeschrieben)
  const profilMitAchievements =
    neueAchievements.length === 0
      ? fortgeschrieben
      : {
          ...fortgeschrieben,
          freigeschalteteAchievements: [
            ...fortgeschrieben.freigeschalteteAchievements,
            ...neueAchievements.map((achievement) => achievement.id),
          ],
          achievementFreischaltDaten: {
            ...fortgeschrieben.achievementFreischaltDaten,
            ...Object.fromEntries(
              neueAchievements.map((achievement) => [
                achievement.id,
                jetzt.toISOString(),
              ]),
            ),
          },
        }

  return {
    profil: profilMitAchievements,
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

  recordEvent: (event, jetzt = new Date()) => {
    const { profil, levelUp } = fortgeschriebenesProfil(
      get().gamification,
      event,
      jetzt,
    )
    set({ gamification: profil })
    return { levelUp, level: profil.level }
  },
})
