import { describe, expect, it } from 'vitest'
import { EngineEvaluationError } from './errors'
import { evaluateAst } from './evaluator'
import type { AstNode } from './types'

describe('evaluateAst', () => {
  it('wertet eine einzelne Zahl aus', () => {
    const node: AstNode = { type: 'number', value: 42 }
    expect(evaluateAst(node)).toBe(42)
  })

  it('wertet unäres Minus aus', () => {
    const node: AstNode = {
      type: 'unary',
      operator: '-',
      operand: { type: 'number', value: 5 },
    }
    expect(evaluateAst(node)).toBe(-5)
  })

  it('wertet ^ als Potenz aus', () => {
    const node: AstNode = {
      type: 'binary',
      operator: '^',
      left: { type: 'number', value: 2 },
      right: { type: 'number', value: 10 },
    }
    expect(evaluateAst(node)).toBe(1024)
  })

  it('wirft bei Division durch Null einen EngineEvaluationError', () => {
    const node: AstNode = {
      type: 'binary',
      operator: '/',
      left: { type: 'number', value: 1 },
      right: { type: 'number', value: 0 },
    }
    expect(() => evaluateAst(node)).toThrow(EngineEvaluationError)
  })

  it('wirft bei Modulo durch Null einen EngineEvaluationError', () => {
    const node: AstNode = {
      type: 'binary',
      operator: '%',
      left: { type: 'number', value: 1 },
      right: { type: 'number', value: 0 },
    }
    expect(() => evaluateAst(node)).toThrow(EngineEvaluationError)
  })
})
