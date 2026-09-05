import { describe, expect, it } from 'vitest'
import { evaluate, formatResult } from './index'

describe('evaluate', () => {
  describe('gültige Ausdrücke', () => {
    const cases: Array<[string, number]> = [
      ['2+3*4', 14],
      ['(2+3)*4', 20],
      ['-2.5*4', -10],
      ['2-3', -1],
      ['2*3', 6],
      ['10/4', 2.5],
      ['10%3', 1],
      ['2^10', 1024],
      ['2^-2', 0.25],
      ['-2^2', -4],
      ['2^3^2', 512],
      ['(1+2)*(3+4)', 21],
      ['-(2+3)', -5],
      ['3+-2', 1],
      ['3--2', 5],
      ['2*-3', -6],
      ['  2 + 3  ', 5],
      ['100%7', 2],
      ['2+3*4-5/5', 13],
      ['((2+3))', 5],
      ['-5%2', -1],
      ['+5', 5],
      ['-0', -0],
      ['1.5+2.5', 4],
      ['3^0', 1],
    ]

    it.each(cases)('evaluate(%s) === %s', (expression, expected) => {
      const result = evaluate(expression)
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value).toBeCloseTo(expected, 10)
      }
    })
  })

  describe('ungültige Ausdrücke liefern ein typisiertes Fehlerergebnis', () => {
    const cases: string[] = [
      '2++',
      '(1+2',
      '',
      '2/0',
      '2%0',
      '2 3',
      '1+*2',
      '1+2)',
      '2+',
      '()',
      '2+x',
    ]

    it.each(cases)('evaluate(%s) wirft keine Exception', (expression) => {
      expect(() => evaluate(expression)).not.toThrow()
      const result = evaluate(expression)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.type).toMatch(/^(syntax-error|evaluation-error)$/)
        expect(typeof result.error.message).toBe('string')
      }
    })
  })

  it('lässt den context-Parameter optional und ohne Einfluss auf das Ergebnis', () => {
    expect(evaluate('2+2')).toEqual(evaluate('2+2', {}))
    expect(evaluate('2+2', { variables: { x: 5 } })).toEqual({
      ok: true,
      value: 4,
    })
  })

  it('meldet Division durch Null als evaluation-error', () => {
    const result = evaluate('1/0')
    expect(result).toEqual({
      ok: false,
      error: { type: 'evaluation-error', message: 'Division durch Null' },
    })
  })

  it('meldet die Fehlerposition bei Syntaxfehlern', () => {
    const result = evaluate('2++')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.type).toBe('syntax-error')
      expect(result.error.position).toBe(3)
    }
  })

  it('meldet Overflow (Ergebnis wird Infinity) als evaluation-error', () => {
    const result = evaluate('10^400')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.type).toBe('evaluation-error')
      expect(typeof result.error.message).toBe('string')
    }
  })

  it('meldet NaN-Ergebnisse (z. B. Wurzel aus negativer Zahl) als evaluation-error', () => {
    const result = evaluate('(-8)^0.5')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.type).toBe('evaluation-error')
    }
  })

  it('formatiert 0.1+0.2 wie gefordert als 0.3', () => {
    const result = evaluate('0.1+0.2')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(formatResult(result.value)).toBe('0.3')
    }
  })
})
