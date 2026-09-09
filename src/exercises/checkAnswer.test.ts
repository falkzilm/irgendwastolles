import { describe, expect, it } from 'vitest'
import { checkAnswer } from './checkAnswer'
import type { Exercise } from './types'

const exact: Exercise = {
  id: 'test-exact',
  category: 'grundrechenarten',
  difficulty: 'leicht',
  prompt: '2 + 3 = ?',
  answer: 5,
  tolerance: 0,
}

const withTolerance: Exercise = {
  id: 'test-tolerance',
  category: 'formel',
  difficulty: 'leicht',
  prompt: 'Berechne die Fläche eines Kreises mit dem Radius 2 (A = π·r²).',
  answer: 12.57,
  tolerance: 0.01,
}

describe('checkAnswer', () => {
  it('akzeptiert die exakt korrekte Antwort ohne Toleranz', () => {
    expect(checkAnswer(exact, 5)).toBe(true)
  })

  it('lehnt eine falsche Antwort ohne Toleranz ab', () => {
    expect(checkAnswer(exact, 4)).toBe(false)
    expect(checkAnswer(exact, 6)).toBe(false)
  })

  it('akzeptiert eine Antwort innerhalb der definierten Toleranz', () => {
    expect(checkAnswer(withTolerance, 12.565)).toBe(true)
    expect(checkAnswer(withTolerance, 12.575)).toBe(true)
  })

  it('akzeptiert die Toleranzgrenze inklusiv', () => {
    expect(checkAnswer(withTolerance, 12.56)).toBe(true)
    expect(checkAnswer(withTolerance, 12.58)).toBe(true)
  })

  it('lehnt eine Antwort außerhalb der Toleranz ab', () => {
    expect(checkAnswer(withTolerance, 12.5)).toBe(false)
    expect(checkAnswer(withTolerance, 12.6)).toBe(false)
  })

  it('lehnt nicht-endliche Werte immer ab', () => {
    expect(checkAnswer(exact, NaN)).toBe(false)
    expect(checkAnswer(exact, Infinity)).toBe(false)
  })

  it('verwendet eine übergebene toleranceOverride statt exercise.tolerance', () => {
    expect(checkAnswer(exact, 5.4, 0.5)).toBe(true)
    expect(checkAnswer(exact, 5.6, 0.5)).toBe(false)
  })

  it('akzeptiert negative Antworten korrekt', () => {
    const negative: Exercise = { ...exact, answer: -5 }

    expect(checkAnswer(negative, -5)).toBe(true)
    expect(checkAnswer(negative, 5)).toBe(false)
  })
})
