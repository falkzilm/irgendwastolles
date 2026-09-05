import { describe, expect, it } from 'vitest'
import { formatResult } from './format'

describe('formatResult', () => {
  it('gibt 0 für 0 und -0 aus', () => {
    expect(formatResult(0)).toBe('0')
    expect(formatResult(-0)).toBe('0')
  })

  it('gibt ganze Zahlen ohne Nachkommastellen aus', () => {
    expect(formatResult(42)).toBe('42')
    expect(formatResult(-5)).toBe('-5')
    expect(formatResult(10)).toBe('10')
  })

  it('behebt Fließkomma-Artefakte wie 0.1+0.2', () => {
    expect(formatResult(0.1 + 0.2)).toBe('0.3')
  })

  it('rundet auf 12 signifikante Stellen', () => {
    expect(formatResult(1 / 3)).toBe('0.333333333333')
    expect(formatResult(2.5)).toBe('2.5')
  })

  it('entfernt überflüssige Nachkommanullen', () => {
    expect(formatResult(1.5)).toBe('1.5')
    expect(formatResult(100.1)).toBe('100.1')
  })

  it('bleibt bis einschließlich 1e11 in Dezimalschreibweise', () => {
    expect(formatResult(999999999999)).toBe('999999999999')
    expect(formatResult(100000000000)).toBe('100000000000')
  })

  it('gibt sehr große Ergebnisse (>= 1e12) in Exponentialschreibweise aus', () => {
    expect(formatResult(1e12)).toBe('1e12')
    expect(formatResult(123456789012345)).toBe('1.23456789012e14')
  })

  it('gibt negative sehr große Ergebnisse in Exponentialschreibweise aus', () => {
    expect(formatResult(-1e12)).toBe('-1e12')
  })

  it('bleibt bis einschließlich 1e-6 in Dezimalschreibweise', () => {
    expect(formatResult(0.000001)).toBe('0.000001')
  })

  it('gibt sehr kleine Ergebnisse (< 1e-6) in Exponentialschreibweise aus', () => {
    expect(formatResult(0.0000001234)).toBe('1.234e-7')
    expect(formatResult(-0.0000001234)).toBe('-1.234e-7')
  })
})
