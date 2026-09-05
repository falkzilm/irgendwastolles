import { EngineEvaluationError, EngineSyntaxError } from './errors'
import { evaluateAst } from './evaluator'
import { parse } from './parser'
import { tokenize } from './tokenizer'
import type { EngineContext, EngineResult } from './types'

export type {
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
export { formatResult } from './format'
export { parse } from './parser'
export { tokenize } from './tokenizer'

/**
 * Öffentliche Engine-API: wertet einen Ausdruck der Grundrechenarten
 * (`+ - * / % ^`, Klammern, Vorzeichen, Dezimalzahlen) aus.
 *
 * Liefert bei ungültigen Ausdrücken (z. B. `2++` oder `(1+2`) ein
 * typisiertes `{ ok: false, error }` statt eine Exception zu werfen.
 *
 * `context` ist für künftige Engine-Items reserviert (z. B. Variablen) und
 * hat aktuell keinen Einfluss auf das Ergebnis.
 */
export function evaluate(
  expression: string,
  context: EngineContext = {},
): EngineResult {
  void context

  try {
    const tokens = tokenize(expression)
    const ast = parse(tokens, expression.length)
    const value = evaluateAst(ast)

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
