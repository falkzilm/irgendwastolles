import { describe, expect, it } from 'vitest'
import { evaluate } from './index'

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

  describe('wissenschaftliche Funktionen und Winkelmodus', () => {
    it('sin(90) im DEG-Modus ergibt 1', () => {
      const result = evaluate('sin(90)', { angleMode: 'deg' })
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value).toBeCloseTo(1, 10)
    })

    it('sin(pi/2) im RAD-Modus ergibt 1', () => {
      const result = evaluate('sin(pi/2)', { angleMode: 'rad' })
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value).toBeCloseTo(1, 10)
    })

    it('derselbe Ausdruck liefert je nach Winkelmodus unterschiedliche Ergebnisse', () => {
      const deg = evaluate('cos(60)', { angleMode: 'deg' })
      const rad = evaluate('cos(60)', { angleMode: 'rad' })
      expect(deg.ok && rad.ok).toBe(true)
      if (deg.ok && rad.ok) {
        expect(deg.value).toBeCloseTo(0.5, 10)
        expect(deg.value).not.toBeCloseTo(rad.value, 5)
      }
    })

    it('ohne angeben Winkelmodus wird Radiant angenommen', () => {
      expect(evaluate('sin(pi/2)')).toEqual(
        evaluate('sin(pi/2)', { angleMode: 'rad' }),
      )
    })

    it('log(100) = 2 und ln(e) = 1', () => {
      const log = evaluate('log(100)')
      const ln = evaluate('ln(e)')
      expect(log.ok).toBe(true)
      expect(ln.ok).toBe(true)
      if (log.ok) expect(log.value).toBeCloseTo(2, 10)
      if (ln.ok) expect(ln.value).toBeCloseTo(1, 10)
    })

    it('exp(0) = 1 (Randfall)', () => {
      const result = evaluate('exp(0)')
      expect(result).toEqual({ ok: true, value: 1 })
    })

    it('sqrt(16) = 4, abs(-3) = 3', () => {
      expect(evaluate('sqrt(16)')).toEqual({ ok: true, value: 4 })
      expect(evaluate('abs(-3)')).toEqual({ ok: true, value: 3 })
    })

    it('fact(5) = 120, fact(0) = 1 (Randfall)', () => {
      expect(evaluate('fact(5)')).toEqual({ ok: true, value: 120 })
      expect(evaluate('fact(0)')).toEqual({ ok: true, value: 1 })
    })

    it('fact(-1) liefert einen evaluation-error (Randfall)', () => {
      const result = evaluate('fact(-1)')
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.type).toBe('evaluation-error')
    })

    it('unbekannte Funktionsnamen liefern einen Fehler mit Position im Ausdruck', () => {
      const result = evaluate('foo(1)')
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.message).toMatch(/unbekannte Funktion/i)
        expect(result.error.position).toBe(0)
      }
    })

    it('unbekannte Funktionsnamen an anderer Position im Ausdruck', () => {
      const result = evaluate('1+bar(2)')
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.message).toMatch(/unbekannte Funktion/i)
        expect(result.error.position).toBe(2)
      }
    })

    it('sqrt(9) verschachtelt in weiterer Rechnung', () => {
      expect(evaluate('sqrt(9)+1')).toEqual({ ok: true, value: 4 })
    })
  })
})
