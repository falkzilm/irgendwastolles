import { describe, expect, it } from 'vitest'
import { EngineSyntaxError } from './errors'
import { parse } from './parser'
import { tokenize } from './tokenizer'
import type { AstNode } from './types'

function parseExpression(expression: string): AstNode {
  return parse(tokenize(expression), expression.length)
}

describe('parse', () => {
  it('respektiert Punkt-vor-Strich', () => {
    expect(parseExpression('2+3*4')).toEqual({
      type: 'binary',
      operator: '+',
      left: { type: 'number', value: 2 },
      right: {
        type: 'binary',
        operator: '*',
        left: { type: 'number', value: 3 },
        right: { type: 'number', value: 4 },
      },
    })
  })

  it('lässt Klammern Vorrang vor Punkt-vor-Strich haben', () => {
    expect(parseExpression('(2+3)*4')).toEqual({
      type: 'binary',
      operator: '*',
      left: {
        type: 'binary',
        operator: '+',
        left: { type: 'number', value: 2 },
        right: { type: 'number', value: 3 },
      },
      right: { type: 'number', value: 4 },
    })
  })

  it('baut unäres Minus als eigenen Knoten', () => {
    expect(parseExpression('-2.5*4')).toEqual({
      type: 'binary',
      operator: '*',
      left: {
        type: 'unary',
        operator: '-',
        operand: { type: 'number', value: 2.5 },
      },
      right: { type: 'number', value: 4 },
    })
  })

  it('wertet ^ rechtsassoziativ aus', () => {
    expect(parseExpression('2^3^2')).toEqual({
      type: 'binary',
      operator: '^',
      left: { type: 'number', value: 2 },
      right: {
        type: 'binary',
        operator: '^',
        left: { type: 'number', value: 3 },
        right: { type: 'number', value: 2 },
      },
    })
  })

  it('parst einen Funktionsaufruf als call-Knoten', () => {
    expect(parseExpression('sin(90)')).toEqual({
      type: 'call',
      name: 'sin',
      args: [{ type: 'number', value: 90 }],
      position: 0,
    })
  })

  it('parst eine Konstante als identifier-Knoten', () => {
    expect(parseExpression('pi')).toEqual({
      type: 'identifier',
      name: 'pi',
      position: 0,
    })
  })

  it('wirft bei leeren Klammern nach einem Funktionsnamen einen EngineSyntaxError', () => {
    expect(() => parseExpression('sin()')).toThrow(EngineSyntaxError)
  })

  it('wirft bei "2++" einen EngineSyntaxError', () => {
    expect(() => parseExpression('2++')).toThrow(EngineSyntaxError)
  })

  it('wirft bei fehlender schließender Klammer einen EngineSyntaxError', () => {
    expect(() => parseExpression('(1+2')).toThrow(EngineSyntaxError)
  })

  it('wirft bei überzähligen Token einen EngineSyntaxError', () => {
    expect(() => parseExpression('1+2)')).toThrow(EngineSyntaxError)
  })

  it('wirft bei leerer Eingabe einen EngineSyntaxError', () => {
    expect(() => parseExpression('')).toThrow(EngineSyntaxError)
  })
})
