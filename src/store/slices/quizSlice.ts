import type { StateCreator } from 'zustand'
import type { Difficulty } from '../../exercises'
import type { AppState } from '../types'

/** Siehe docs/state.md - IRGENDWAST-38. */
export const MAX_QUIZ_ERGEBNISSE = 50

/**
 * Ergebnis einer abgeschlossenen Quizrunde (IRGENDWAST-38). Wird von
 * `addQuizErgebnis` um `id`/`timestamp` ergänzt und dient der
 * Gamification-Auswertung sowie einer künftigen Rundenhistorie als
 * abrufbare, persistierte Datengrundlage.
 */
export interface QuizErgebnis {
  id: string
  difficulty: Difficulty
  anzahlAufgaben: number
  anzahlRichtig: number
  dauerMs: number
  timestamp: number
}

export type QuizErgebnisInput = Omit<QuizErgebnis, 'id' | 'timestamp'>

export interface QuizSlice {
  quizErgebnisse: QuizErgebnis[]
  /** Fügt ein neues Rundenergebnis vorne an und kappt bei `MAX_QUIZ_ERGEBNISSE`. */
  addQuizErgebnis: (ergebnis: QuizErgebnisInput) => void
}

export const createQuizSlice: StateCreator<AppState, [], [], QuizSlice> = (
  set,
) => ({
  quizErgebnisse: [],

  addQuizErgebnis: (ergebnis) =>
    set((state) => ({
      quizErgebnisse: [
        { id: crypto.randomUUID(), timestamp: Date.now(), ...ergebnis },
        ...state.quizErgebnisse,
      ].slice(0, MAX_QUIZ_ERGEBNISSE),
    })),
})
