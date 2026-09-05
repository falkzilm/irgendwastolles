import { EngineEvaluationError } from './errors'
import type { AstNode } from './types'

/** Wertet einen AST rekursiv zu einer Zahl aus. */
export function evaluateAst(node: AstNode): number {
  switch (node.type) {
    case 'number':
      return node.value
    case 'unary': {
      const value = evaluateAst(node.operand)
      return node.operator === '-' ? -value : value
    }
    case 'binary': {
      const left = evaluateAst(node.left)
      const right = evaluateAst(node.right)
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
