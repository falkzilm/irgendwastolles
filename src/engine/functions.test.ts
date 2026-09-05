import { describe, expect, it } from 'vitest'
import { EngineEvaluationError } from './errors'
import { CONSTANTS, FUNCTIONS } from './functions'

describe('CONSTANTS', () => {
  it('kennt pi und e', () => {
    expect(CONSTANTS.pi).toBeCloseTo(Math.PI, 10)
    expect(CONSTANTS.e).toBeCloseTo(Math.E, 10)
  })
})

describe('FUNCTIONS', () => {
  describe('sin/cos/tan', () => {
    it('werten im DEG-Modus in Grad aus', () => {
      expect(FUNCTIONS.sin(90, 'deg')).toBeCloseTo(1, 10)
      expect(FUNCTIONS.cos(180, 'deg')).toBeCloseTo(-1, 10)
      expect(FUNCTIONS.tan(45, 'deg')).toBeCloseTo(1, 10)
    })

    it('werten im RAD-Modus in Radiant aus', () => {
      expect(FUNCTIONS.sin(Math.PI / 2, 'rad')).toBeCloseTo(1, 10)
      expect(FUNCTIONS.cos(Math.PI, 'rad')).toBeCloseTo(-1, 10)
    })
  })

  describe('asin/acos/atan', () => {
    it('liefern im DEG-Modus Grad zurück', () => {
      expect(FUNCTIONS.asin(1, 'deg')).toBeCloseTo(90, 10)
      expect(FUNCTIONS.atan(1, 'deg')).toBeCloseTo(45, 10)
    })

    it('liefern im RAD-Modus Radiant zurück', () => {
      expect(FUNCTIONS.asin(1, 'rad')).toBeCloseTo(Math.PI / 2, 10)
    })

    it('liefern für einen Wert außerhalb [-1, 1] NaN (Randfall Definitionsbereich)', () => {
      expect(FUNCTIONS.asin(2, 'rad')).toBeNaN()
      expect(FUNCTIONS.acos(-2, 'rad')).toBeNaN()
    })
  })

  describe('log/ln/exp', () => {
    it('log ist der Logarithmus zur Basis 10, ln der natürliche Logarithmus', () => {
      expect(FUNCTIONS.log(100, 'rad')).toBeCloseTo(2, 10)
      expect(FUNCTIONS.ln(Math.E, 'rad')).toBeCloseTo(1, 10)
    })

    it('exp ist die Umkehrfunktion von ln', () => {
      expect(FUNCTIONS.exp(0, 'rad')).toBe(1)
    })

    it('log(0) liefert -Infinity (Randfall Definitionsbereich)', () => {
      expect(FUNCTIONS.log(0, 'rad')).toBe(-Infinity)
    })
  })

  describe('sqrt', () => {
    it('berechnet die Quadratwurzel', () => {
      expect(FUNCTIONS.sqrt(9, 'rad')).toBe(3)
    })

    it('liefert für negative Zahlen NaN (Randfall Definitionsbereich)', () => {
      expect(FUNCTIONS.sqrt(-1, 'rad')).toBeNaN()
    })
  })

  describe('abs', () => {
    it('liefert den Betrag einer negativen Zahl', () => {
      expect(FUNCTIONS.abs(-5, 'rad')).toBe(5)
    })

    it('lässt 0 unverändert (Randfall)', () => {
      expect(FUNCTIONS.abs(0, 'rad')).toBe(0)
    })
  })

  describe('fact', () => {
    it('berechnet die Fakultät einer positiven Zahl', () => {
      expect(FUNCTIONS.fact(5, 'rad')).toBe(120)
    })

    it('liefert für 0 den Wert 1 (Randfall)', () => {
      expect(FUNCTIONS.fact(0, 'rad')).toBe(1)
    })

    it('wirft für negative Zahlen einen EngineEvaluationError (Randfall)', () => {
      expect(() => FUNCTIONS.fact(-1, 'rad')).toThrow(EngineEvaluationError)
    })

    it('wirft für nicht-ganzzahlige Werte einen EngineEvaluationError (Randfall)', () => {
      expect(() => FUNCTIONS.fact(1.5, 'rad')).toThrow(EngineEvaluationError)
    })
  })
})
