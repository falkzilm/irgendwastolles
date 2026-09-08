import { evaluate } from '../engine'
import type { AngleMode } from '../engine'
import type { Formula } from './types'

export type FormulaEvaluationErrorType =
  'missing-variable' | 'out-of-range' | 'syntax-error' | 'evaluation-error'

export interface FormulaEvaluationError {
  type: FormulaEvaluationErrorType
  message: string
  /** Betroffene Variable, sofern der Fehler eine bestimmte Variable betrifft (missing-variable, out-of-range). */
  variable?: string
}

export type FormulaEvaluationResult =
  { ok: true; value: number } | { ok: false; error: FormulaEvaluationError }

function describeRange(
  min: number | undefined,
  max: number | undefined,
): string {
  if (min !== undefined && max !== undefined) {
    return `zwischen ${min} und ${max}`
  }
  if (min !== undefined) {
    return `mindestens ${min}`
  }
  return `höchstens ${max}`
}

/**
 * Wertet eine Formel aus dem Katalog (`Formula`) mit konkreten
 * Variablenwerten über die Rechen-Engine (`evaluate()`) aus.
 *
 * Vor der Auswertung wird für jede in `formula.variables` deklarierte
 * Variable geprüft, ob `values` einen Wert enthält (sonst
 * `missing-variable`) und ob dieser - sofern die Variable einen `range`
 * definiert - innerhalb der erlaubten Grenzen liegt (sonst
 * `out-of-range`). Beide Fehler tragen den betroffenen Variablennamen in
 * `error.variable`, damit sich der Fehler in einer UI eindeutig einem
 * Eingabefeld zuordnen lässt. Geprüft wird in der Reihenfolge von
 * `formula.variables`; die erste ungültige Variable wird gemeldet.
 *
 * Erst wenn alle Variablen gültig sind, wird `formula.expression` mit den
 * übergebenen Werten als `context.variables` über `evaluate()` ausgewertet
 * (siehe `docs/engine.md`) - Syntax- und Auswertungsfehler der Engine
 * (z. B. Division durch Null) werden unverändert durchgereicht.
 */
export function evaluateFormula(
  formula: Formula,
  values: Record<string, number>,
  context: { angleMode?: AngleMode } = {},
): FormulaEvaluationResult {
  for (const variable of formula.variables) {
    const value = values[variable.name]

    if (value === undefined) {
      return {
        ok: false,
        error: {
          type: 'missing-variable',
          variable: variable.name,
          message: `Fehlender Wert für Variable "${variable.name}"`,
        },
      }
    }

    const { min, max } = variable.range ?? {}
    if (
      (min !== undefined && value < min) ||
      (max !== undefined && value > max)
    ) {
      return {
        ok: false,
        error: {
          type: 'out-of-range',
          variable: variable.name,
          message: `Wert für Variable "${variable.name}" (${value}) liegt außerhalb des zulässigen Wertebereichs (${describeRange(min, max)})`,
        },
      }
    }
  }

  const result = evaluate(formula.expression, {
    variables: values,
    angleMode: context.angleMode,
  })

  if (!result.ok) {
    return {
      ok: false,
      error: { type: result.error.type, message: result.error.message },
    }
  }

  return { ok: true, value: result.value }
}
