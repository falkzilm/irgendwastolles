import { describe, expect, it } from 'vitest'
import { generateExercises } from './generator'
import { DIFFICULTIES, EXERCISE_CATEGORIES } from './types'
import type { Difficulty } from './types'

describe('generateExercises', () => {
  it('liefert die angeforderte Anzahl an Aufgaben', () => {
    const exercises = generateExercises({
      seed: 1,
      count: 15,
      difficulty: 'mittel',
    })

    expect(exercises).toHaveLength(15)
  })

  it('liefert eine leere Liste für count: 0', () => {
    expect(
      generateExercises({ seed: 1, count: 0, difficulty: 'leicht' }),
    ).toEqual([])
  })

  it.each(DIFFICULTIES)(
    'liefert für Schwierigkeit "%s" Aufgaben mit Aufgabentext und numerischer Lösung',
    (difficulty: Difficulty) => {
      const exercises = generateExercises({ seed: 7, count: 10, difficulty })

      expect(exercises.length).toBeGreaterThan(0)
      for (const exercise of exercises) {
        expect(exercise.difficulty).toBe(difficulty)
        expect(typeof exercise.prompt).toBe('string')
        expect(exercise.prompt.length).toBeGreaterThan(0)
        expect(Number.isFinite(exercise.answer)).toBe(true)
        expect(EXERCISE_CATEGORIES).toContain(exercise.category)
      }
    },
  )

  it('erzeugt bei gleichem Seed reproduzierbar dieselbe Aufgabenfolge', () => {
    const a = generateExercises({ seed: 42, count: 20, difficulty: 'schwer' })
    const b = generateExercises({ seed: 42, count: 20, difficulty: 'schwer' })

    expect(b).toEqual(a)
  })

  it('erzeugt bei unterschiedlichem Seed eine andere Aufgabenfolge', () => {
    const a = generateExercises({ seed: 1, count: 20, difficulty: 'mittel' })
    const b = generateExercises({ seed: 2, count: 20, difficulty: 'mittel' })

    expect(b).not.toEqual(a)
  })

  it('beschränkt die Aufgaben auf die übergebenen Kategorien', () => {
    const exercises = generateExercises({
      seed: 3,
      count: 25,
      difficulty: 'mittel',
      categories: ['prozent'],
    })

    expect(exercises.length).toBeGreaterThan(0)
    for (const exercise of exercises) {
      expect(exercise.category).toBe('prozent')
    }
  })

  it('wirft bei leerer Kategorienliste', () => {
    expect(() =>
      generateExercises({
        seed: 1,
        count: 1,
        difficulty: 'leicht',
        categories: [],
      }),
    ).toThrow()
  })

  it('wirft bei count: Infinity statt endlos zu laufen', () => {
    expect(() =>
      generateExercises({ seed: 1, count: Infinity, difficulty: 'leicht' }),
    ).toThrow()
  })

  it('wirft bei negativem count', () => {
    expect(() =>
      generateExercises({ seed: 1, count: -1, difficulty: 'leicht' }),
    ).toThrow()
  })

  it('wirft bei nicht-ganzzahligem count', () => {
    expect(() =>
      generateExercises({ seed: 1, count: 1.5, difficulty: 'leicht' }),
    ).toThrow()
  })

  it('liefert bei Subtraktion nie ein negatives Ergebnis', () => {
    const exercises = generateExercises({
      seed: 99,
      count: 50,
      difficulty: 'mittel',
      categories: ['grundrechenarten'],
    }).filter((exercise) => exercise.prompt.includes(' - '))

    expect(exercises.length).toBeGreaterThan(0)
    for (const exercise of exercises) {
      expect(exercise.answer).toBeGreaterThanOrEqual(0)
    }
  })

  it('liefert bei Division ein ganzzahliges, exaktes Ergebnis', () => {
    const exercises = generateExercises({
      seed: 12,
      count: 80,
      difficulty: 'schwer',
      categories: ['grundrechenarten'],
    }).filter((exercise) => exercise.prompt.includes(' / '))

    expect(exercises.length).toBeGreaterThan(0)
    for (const exercise of exercises) {
      const [dividend, divisor] = exercise.prompt
        .split(' = ')[0]
        .split(' / ')
        .map(Number)

      expect(dividend / divisor).toBe(exercise.answer)
      expect(exercise.tolerance).toBe(0)
    }
  })

  it('berechnet Prozentaufgaben vom Typ "Anteil" korrekt', () => {
    const exercises = generateExercises({
      seed: 5,
      count: 60,
      difficulty: 'mittel',
      categories: ['prozent'],
    })
    const anteil = exercises.find((exercise) =>
      exercise.prompt.startsWith('Wie viel sind'),
    )

    expect(anteil).toBeDefined()
    const match = anteil?.prompt.match(/Wie viel sind (\d+)% von (\d+)\?/)
    expect(match).not.toBeNull()
    const [, percent, base] = match!

    expect(anteil?.answer).toBeCloseTo(
      (Number(base) * Number(percent)) / 100,
      2,
    )
  })

  it('berechnet die Kreisflächenformel korrekt (A = π·r²)', () => {
    const exercises = generateExercises({
      seed: 8,
      count: 100,
      difficulty: 'leicht',
      categories: ['formel'],
    })
    const kreis = exercises.find((exercise) =>
      exercise.prompt.includes('Kreises'),
    )

    expect(kreis).toBeDefined()
    const match = kreis?.prompt.match(/Radius (\d+)/)
    expect(match).not.toBeNull()
    const r = Number(match![1])

    expect(kreis?.answer).toBeCloseTo(Math.PI * r * r, 2)
  })
})
