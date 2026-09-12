import type { Formula } from '../../formulas'
import type { QuizErgebnis, VerlaufEintrag } from '../../store'

/** Kurze deutsche Wochentagsnamen, indiziert nach `Date.getDay()` (0 = Sonntag). */
export const WOCHENTAGE_KURZ = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

export interface TagesWert {
  /** Lokales Kalenderdatum `YYYY-MM-DD`. */
  datum: string
  /** Kurzer Wochentagsname, siehe `WOCHENTAGE_KURZ`. */
  wochentag: string
  anzahl: number
}

/**
 * Lokaler Kalendertag (nicht UTC) als `YYYY-MM-DD`, analog zu `lokalerTag`
 * in `gamificationSlice.ts` (dort nicht exportiert).
 */
function lokalerTag(zeitpunkt: Date): string {
  const jahr = zeitpunkt.getFullYear()
  const monat = String(zeitpunkt.getMonth() + 1).padStart(2, '0')
  const tag = String(zeitpunkt.getDate()).padStart(2, '0')
  return `${jahr}-${monat}-${tag}`
}

/**
 * `anzahlTage` Kalendertage vor `zeitpunkt`, per lokaler Datumsarithmetik
 * (nicht über Millisekunden-Subtraktion), damit ein Sommer-/Winterzeitwechsel
 * das Ergebnis nicht auf den falschen Kalendertag verschiebt.
 */
function tageZuvor(zeitpunkt: Date, anzahlTage: number): Date {
  return new Date(
    zeitpunkt.getFullYear(),
    zeitpunkt.getMonth(),
    zeitpunkt.getDate() - anzahlTage,
  )
}

/**
 * Anzahl Berechnungen je Kalendertag für die letzten `tage` Tage (inklusive
 * heute), älteste zuerst (IRGENDWAST-49). Zählt anhand des lokalen
 * Kalendertags von `eintrag.timestamp`.
 */
export function berechnungenProTag(
  verlauf: VerlaufEintrag[],
  tage = 7,
  jetzt: Date = new Date(),
): TagesWert[] {
  const tageListe: TagesWert[] = Array.from({ length: tage }, (_, index) => {
    const tagDatum = tageZuvor(jetzt, tage - 1 - index)
    return {
      datum: lokalerTag(tagDatum),
      wochentag: WOCHENTAGE_KURZ[tagDatum.getDay()],
      anzahl: 0,
    }
  })

  const indexNachTag = new Map(
    tageListe.map((eintrag, index) => [eintrag.datum, index]),
  )
  for (const eintrag of verlauf) {
    const index = indexNachTag.get(lokalerTag(new Date(eintrag.timestamp)))
    if (index !== undefined) tageListe[index].anzahl += 1
  }

  return tageListe
}

export interface QuizStatistik {
  anzahlRunden: number
  /** Anteil richtiger Antworten (0..1) über die gespeicherten Rundenergebnisse, `null` ohne Runden. */
  trefferquote: number | null
}

/**
 * Trefferquote und Rundenanzahl fürs Statistik-Dashboard (IRGENDWAST-49).
 * `anzahlRunden` kommt vom uncapped Zähler aus dem Gamification-Profil,
 * die Trefferquote wird über die (auf `MAX_QUIZ_ERGEBNISSE` gekappte)
 * Ergebnisliste berechnet, da einzelne Trefferzahlen älterer Runden nicht
 * darüber hinaus gespeichert werden.
 */
export function berechneQuizStatistik(
  quizErgebnisse: QuizErgebnis[],
  anzahlRunden: number,
): QuizStatistik {
  if (quizErgebnisse.length === 0) {
    return { anzahlRunden, trefferquote: null }
  }

  const { aufgaben, richtig } = quizErgebnisse.reduce(
    (summe, ergebnis) => ({
      aufgaben: summe.aufgaben + ergebnis.anzahlAufgaben,
      richtig: summe.richtig + ergebnis.anzahlRichtig,
    }),
    { aufgaben: 0, richtig: 0 },
  )

  return {
    anzahlRunden,
    trefferquote: aufgaben === 0 ? null : richtig / aufgaben,
  }
}

export interface FormelNutzungEintrag {
  formula: Formula
  anzahl: number
}

/**
 * Die `anzahl` meistgenutzten Formeln (IRGENDWAST-49), absteigend sortiert.
 * Ids ohne passende Formel im übergebenen Katalog (z. B. nach Entfernen aus
 * dem Katalog) werden übersprungen statt einen Fehler zu werfen.
 */
export function topFormeln(
  formelNutzung: Record<string, number>,
  katalog: Formula[],
  anzahl = 3,
): FormelNutzungEintrag[] {
  const katalogNachId = new Map(katalog.map((formula) => [formula.id, formula]))

  return Object.entries(formelNutzung)
    .map(([formulaId, count]) => {
      const formula = katalogNachId.get(formulaId)
      return formula ? { formula, anzahl: count } : null
    })
    .filter((eintrag): eintrag is FormelNutzungEintrag => eintrag !== null)
    .sort((a, b) => b.anzahl - a.anzahl)
    .slice(0, anzahl)
}
