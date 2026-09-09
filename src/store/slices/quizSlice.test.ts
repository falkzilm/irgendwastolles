import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../index'
import { MAX_QUIZ_ERGEBNISSE } from './quizSlice'

const initialState = useAppStore.getState()

describe('quizSlice', () => {
  beforeEach(() => {
    useAppStore.setState(initialState, true)
  })

  it('fügt ein Quizergebnis vorne an', () => {
    useAppStore.getState().addQuizErgebnis({
      difficulty: 'leicht',
      anzahlAufgaben: 10,
      anzahlRichtig: 7,
      dauerMs: 60_000,
    })
    useAppStore.getState().addQuizErgebnis({
      difficulty: 'mittel',
      anzahlAufgaben: 5,
      anzahlRichtig: 5,
      dauerMs: 30_000,
    })

    const quizErgebnisse = useAppStore.getState().quizErgebnisse
    expect(quizErgebnisse).toHaveLength(2)
    expect(quizErgebnisse[0]).toMatchObject({
      difficulty: 'mittel',
      anzahlAufgaben: 5,
      anzahlRichtig: 5,
      dauerMs: 30_000,
    })
    expect(quizErgebnisse[1]).toMatchObject({
      difficulty: 'leicht',
      anzahlAufgaben: 10,
      anzahlRichtig: 7,
      dauerMs: 60_000,
    })
    expect(typeof quizErgebnisse[0].id).toBe('string')
    expect(typeof quizErgebnisse[0].timestamp).toBe('number')
  })

  it('begrenzt die Ergebnisliste auf MAX_QUIZ_ERGEBNISSE Einträge', () => {
    for (let i = 0; i < MAX_QUIZ_ERGEBNISSE + 10; i++) {
      useAppStore.getState().addQuizErgebnis({
        difficulty: 'leicht',
        anzahlAufgaben: 10,
        anzahlRichtig: i,
        dauerMs: 1000,
      })
    }

    const quizErgebnisse = useAppStore.getState().quizErgebnisse
    expect(quizErgebnisse).toHaveLength(MAX_QUIZ_ERGEBNISSE)
    expect(quizErgebnisse[0]).toMatchObject({
      anzahlRichtig: MAX_QUIZ_ERGEBNISSE + 9,
    })
  })
})
