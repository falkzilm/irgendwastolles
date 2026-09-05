import type { StateCreator } from 'zustand'
import { evaluate as evaluateExpression, formatResult } from '../../engine'
import type { AppState } from '../types'

const OPERATORS = new Set(['+', '-', '*', '/'])

export interface CalculatorSlice {
  expression: string
  result: string | null
  error: string | null
  /** Ob das aktuelle `result` durch `=` entstanden ist, siehe `input()`. */
  justEvaluated: boolean
  input: (token: string) => void
  clear: () => void
  backspace: () => void
  evaluate: () => void
  /** Übernimmt einen Ausdruck (z. B. aus dem Verlauf, IRGENDWAST-26) ins Display. */
  loadExpression: (expression: string) => void
}

export const createCalculatorSlice: StateCreator<
  AppState,
  [],
  [],
  CalculatorSlice
> = (set, get) => ({
  expression: '',
  result: null,
  error: null,
  justEvaluated: false,

  input: (token) =>
    set((state) => {
      if (!state.justEvaluated) {
        return { expression: state.expression + token, error: null }
      }

      // Nach '=' beginnt eine neue Eingabe (siehe IRGENDWAST-24): ein Operator
      // rechnet mit dem vorigen Ergebnis weiter, alles andere startet einen
      // frischen Ausdruck - so wird das Ergebnis nie durch Anhängen verstümmelt.
      const expression = OPERATORS.has(token)
        ? (state.result ?? '') + token
        : token
      return {
        expression,
        result: null,
        error: null,
        justEvaluated: false,
      }
    }),

  clear: () =>
    set({ expression: '', result: null, error: null, justEvaluated: false }),

  backspace: () =>
    set((state) => {
      if (state.justEvaluated) {
        return {
          expression: '',
          result: null,
          error: null,
          justEvaluated: false,
        }
      }
      return { expression: state.expression.slice(0, -1), error: null }
    }),

  evaluate: () => {
    const { expression, angleMode } = get()
    if (!expression) return

    const outcome = evaluateExpression(expression, { angleMode })
    if (outcome.ok) {
      const result = formatResult(outcome.value)
      set({ result, error: null, justEvaluated: true })
      get().addVerlaufEintrag(expression, result)
      return
    }
    set({ result: null, error: outcome.error.message, justEvaluated: false })
  },

  loadExpression: (expression) =>
    set({ expression, result: null, error: null, justEvaluated: false }),
})
