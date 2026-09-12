import { describe, expect, it } from 'vitest'
import {
  berechneQuizStatistik,
  berechnungenProTag,
  topFormeln,
} from './statistik'
import type { Formula } from '../../formulas'
import type { QuizErgebnis, VerlaufEintrag } from '../../store'

const kreisflaeche: Formula = {
  id: 'kreisflaeche',
  title: 'Kreisfläche',
  category: 'geometrie',
  description: 'Fläche eines Kreises aus dem Radius',
  latex: 'A = \\pi r^2',
  expression: 'pi*r^2',
  variables: [{ name: 'r', unit: 'm', range: { min: 0 } }],
  examples: [{ values: { r: 2 }, expected: Math.PI * 4 }],
  source: 'Schulbuch Mathematik Sek I',
}

const kreisumfang: Formula = {
  ...kreisflaeche,
  id: 'kreisumfang',
  title: 'Kreisumfang',
}

function verlaufEintrag(timestamp: number): VerlaufEintrag {
  return { id: String(timestamp), expression: '1+1', result: '2', timestamp }
}

function quizErgebnis(
  anzahlAufgaben: number,
  anzahlRichtig: number,
): QuizErgebnis {
  return {
    id: `${anzahlAufgaben}-${anzahlRichtig}`,
    difficulty: 'leicht',
    anzahlAufgaben,
    anzahlRichtig,
    dauerMs: 1000,
    timestamp: 0,
  }
}

describe('berechnungenProTag', () => {
  it('liefert 7 Tage mit Anzahl 0, wenn der Verlauf leer ist', () => {
    const jetzt = new Date(2026, 8, 12, 10, 0, 0)

    const ergebnis = berechnungenProTag([], 7, jetzt)

    expect(ergebnis).toHaveLength(7)
    expect(ergebnis.every((tag) => tag.anzahl === 0)).toBe(true)
    expect(ergebnis[6].datum).toBe('2026-09-12')
    expect(ergebnis[0].datum).toBe('2026-09-06')
  })

  it('zählt Berechnungen dem lokalen Kalendertag ihres Zeitstempels zu', () => {
    const jetzt = new Date(2026, 8, 12, 10, 0, 0)
    const heute = new Date(2026, 8, 12, 8, 0, 0).getTime()
    const gestern = new Date(2026, 8, 11, 23, 59, 0).getTime()
    const vorEinerWoche = new Date(2026, 8, 1, 12, 0, 0).getTime()

    const ergebnis = berechnungenProTag(
      [
        verlaufEintrag(heute),
        verlaufEintrag(heute),
        verlaufEintrag(gestern),
        verlaufEintrag(vorEinerWoche),
      ],
      7,
      jetzt,
    )

    expect(ergebnis[6]).toMatchObject({ datum: '2026-09-12', anzahl: 2 })
    expect(ergebnis[5]).toMatchObject({ datum: '2026-09-11', anzahl: 1 })
    const gesamt = ergebnis.reduce((summe, tag) => summe + tag.anzahl, 0)
    expect(gesamt).toBe(3)
  })
})

describe('berechneQuizStatistik', () => {
  it('liefert trefferquote null ohne gespeicherte Rundenergebnisse', () => {
    expect(berechneQuizStatistik([], 0)).toEqual({
      anzahlRunden: 0,
      trefferquote: null,
    })
  })

  it('berechnet die Trefferquote über alle gespeicherten Runden', () => {
    const ergebnis = berechneQuizStatistik(
      [quizErgebnis(10, 8), quizErgebnis(5, 5)],
      2,
    )

    expect(ergebnis.anzahlRunden).toBe(2)
    expect(ergebnis.trefferquote).toBeCloseTo(13 / 15)
  })

  it('nutzt die übergebene Gesamtanzahl an Runden, nicht die Länge der Ergebnisliste', () => {
    const ergebnis = berechneQuizStatistik([quizErgebnis(10, 8)], 42)

    expect(ergebnis.anzahlRunden).toBe(42)
  })
})

describe('topFormeln', () => {
  it('liefert eine leere Liste ohne Nutzung', () => {
    expect(topFormeln({}, [kreisflaeche, kreisumfang])).toEqual([])
  })

  it('sortiert absteigend nach Nutzungsanzahl und kappt auf die angegebene Anzahl', () => {
    const ergebnis = topFormeln(
      { kreisflaeche: 2, kreisumfang: 5 },
      [kreisflaeche, kreisumfang],
      1,
    )

    expect(ergebnis).toEqual([{ formula: kreisumfang, anzahl: 5 }])
  })

  it('überspringt ids ohne passende Formel im Katalog', () => {
    const ergebnis = topFormeln({ kreisflaeche: 2, 'geloeschte-formel': 9 }, [
      kreisflaeche,
    ])

    expect(ergebnis).toEqual([{ formula: kreisflaeche, anzahl: 2 }])
  })
})
