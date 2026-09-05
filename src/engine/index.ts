import { EngineEvaluationError, EngineSyntaxError } from './errors'
import { evaluateAst } from './evaluator'
import { parse } from './parser'
import { tokenize } from './tokenizer'
import type { EngineContext, EngineResult } from './types'

export type {
  AngleMode,
  AstNode,
  BinaryOperator,
  EngineContext,
  EngineError,
  EngineErrorType,
  EngineResult,
  Token,
  TokenType,
  UnaryOperator,
} from './types'
export { evaluateAst } from './evaluator'
export { EngineEvaluationError, EngineSyntaxError } from './errors'
export { CONSTANTS, FUNCTIONS } from './functions'
export { parse } from './parser'
export { tokenize } from './tokenizer'

/**
 * Öffentliche Engine-API: wertet einen Ausdruck der Grundrechenarten
 * (`+ - * / % ^`, Klammern, Vorzeichen, Dezimalzahlen), wissenschaftlicher
 * Funktionen (`sin`/`cos`/`tan`/`asin`/`acos`/`atan`/`log`/`ln`/`exp`/`sqrt`/
 * `abs`/`fact`) und der Konstanten `pi`/`e` aus.
 *
 * Liefert bei ungültigen Ausdrücken (z. B. `2++`, `(1+2` oder einem
 * unbekannten Funktionsnamen) ein typisiertes `{ ok: false, error }` statt
 * eine Exception zu werfen.
 *
 * `context.angleMode` (Standard `'rad'`) steuert die Winkeleinheit der
 * trigonometrischen Funktionen und wird pro Aufruf übergeben statt global
 * gesetzt. `context.variables` ist weiterhin ein Platzhalter ohne Einfluss
 * auf das Ergebnis.
 */
export function evaluate(
  expression: string,
  context: EngineContext = {},
): EngineResult {
  try {
    const tokens = tokenize(expression)
    const ast = parse(tokens, expression.length)
    const value = evaluateAst(ast, context)

    if (!Number.isFinite(value)) {
      return {
        ok: false,
        error: {
          type: 'evaluation-error',
          message: 'Ergebnis ist keine endliche Zahl.',
        },
      }
    }

    return { ok: true, value }
  } catch (error) {
    if (error instanceof EngineSyntaxError) {
      return {
        ok: false,
        error: {
          type: 'syntax-error',
          message: error.message,
          position: error.position,
        },
      }
    }
    if (error instanceof EngineEvaluationError) {
      return {
        ok: false,
        error: { type: 'evaluation-error', message: error.message },
      }
    }
    throw error
  }
}
