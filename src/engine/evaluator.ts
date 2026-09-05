import { EngineEvaluationError, EngineSyntaxError } from './errors'
import { CONSTANTS, FUNCTIONS } from './functions'
import type { AstNode, EngineContext } from './types'

/**
 * Wertet einen AST rekursiv zu einer Zahl aus. `context.angleMode` (Standard
 * `'rad'`) bestimmt die Winkeleinheit für trigonometrische Funktionen, siehe
 * `functions.ts`.
 */
export function evaluateAst(
  node: AstNode,
  context: EngineContext = {},
): number {
  switch (node.type) {
    case 'number':
      return node.value
    case 'identifier': {
      const value = CONSTANTS[node.name]
      if (value === undefined) {
        throw new EngineSyntaxError(
          `Unbekannte Konstante "${node.name}" an Position ${node.position}`,
          node.position,
        )
      }
      return value
    }
    case 'call': {
      const fn = FUNCTIONS[node.name]
      if (!fn) {
        throw new EngineSyntaxError(
          `Unbekannte Funktion "${node.name}" an Position ${node.position}`,
          node.position,
        )
      }
      const arg = evaluateAst(node.args[0], context)
      return fn(arg, context.angleMode ?? 'rad')
    }
    case 'unary': {
      const value = evaluateAst(node.operand, context)
      return node.operator === '-' ? -value : value
    }
    case 'binary': {
      const left = evaluateAst(node.left, context)
      const right = evaluateAst(node.right, context)
      switch (node.operator) {
        case '+':
          return left + right
        case '-':
          return left - right
        case '*':
          return left * right
        case '/':
          if (right === 0) {
            throw new EngineEvaluationError('Division durch Null')
          }
          return left / right
        case '%':
          if (right === 0) {
            throw new EngineEvaluationError('Division durch Null')
          }
          return left % right
        case '^':
          return Math.pow(left, right)
      }
    }
  }
}
