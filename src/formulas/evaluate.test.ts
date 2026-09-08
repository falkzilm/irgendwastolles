import { describe, expect, it } from 'vitest'
import { formatResult } from '../engine'
import { evaluateFormula } from './evaluate'
import type { Formula } from './types'

const kreisflaeche: Formula = {
  id: 'kreisflaeche',
  title: 'Kreisfläche',
  category: 'geometrie',
  description: 'Fläche eines Kreises aus dem Radius',
  latex: 'A = \\pi r^2',
  expression: 'pi*r^2',
  variables: [{ name: 'r', unit: 'm', range: { min: 0 } }],
  examples: [{ values: { r: 2 }, expected: Math.PI * 4 }],
  source: 'Schulbuch Mathematik Sek I',
}

const kreisumfang: Formula = {
  id: 'kreisumfang',
  title: 'Kreisumfang',
  category: 'geometrie',
  description: 'Umfang eines Kreises aus dem Radius',
  latex: 'U = 2 \\pi r',
  expression: '2*pi*r',
  variables: [{ name: 'r', unit: 'm', range: { min: 0 } }],
  examples: [{ values: { r: 3 }, expected: 2 * Math.PI * 3 }],
  source: 'Schulbuch Mathematik Sek I',
}

const rechteckflaeche: Formula = {
  id: 'rechteckflaeche',
  title: 'Rechteckfläche',
  category: 'geometrie',
  description: 'Fläche eines Rechtecks aus den Seitenlängen',
  latex: 'A = a \\cdot b',
  expression: 'a*b',
  variables: [
    { name: 'a', unit: 'm', range: { min: 0 } },
    { name: 'b', unit: 'm', range: { min: 0 } },
  ],
  examples: [{ values: { a: 4, b: 5 }, expected: 20 }],
  source: 'Schulbuch Mathematik Sek I',
}

const pythagoras: Formula = {
  id: 'pythagoras-hypotenuse',
  title: 'Hypotenuse (Pythagoras)',
  category: 'geometrie',
  description: 'Hypotenuse eines rechtwinkligen Dreiecks aus den Katheten',
  latex: 'c = \\sqrt{a^2 + b^2}',
  expression: 'sqrt(a^2+b^2)',
  variables: [
    { name: 'a', unit: 'm', range: { min: 0 } },
    { name: 'b', unit: 'm', range: { min: 0 } },
  ],
  examples: [{ values: { a: 3, b: 4 }, expected: 5 }],
  source: 'Schulbuch Mathematik Sek I',
}

const ohmschesGesetz: Formula = {
  id: 'ohmsches-gesetz',
  title: 'Ohmsches Gesetz',
  category: 'physik',
  description: 'Elektrische Spannung aus Stromstärke und Widerstand',
  latex: 'U = I \\cdot R',
  expression: 'I*R',
  variables: [
    { name: 'I', unit: 'A' },
    { name: 'R', unit: 'Ω', range: { min: 0 } },
  ],
  examples: [{ values: { I: 2, R: 10 }, expected: 20 }],
  source: 'Schulbuch Physik Sek I',
}

const wuerfelvolumen: Formula = {
  id: 'wuerfelvolumen',
  title: 'Würfelvolumen',
  category: 'geometrie',
  description: 'Volumen eines Würfels aus der Kantenlänge',
  latex: 'V = a^3',
  expression: 'a^3',
  variables: [{ name: 'a', unit: 'm', range: { min: 0, max: 100 } }],
  examples: [{ values: { a: 3 }, expected: 27 }],
  source: 'Schulbuch Mathematik Sek I',
}

describe('evaluateFormula', () => {
  it('wertet die Kreisflächenformel für r=2 aus (auf 12 signifikante Stellen gerundet)', () => {
    const result = evaluateFormula(kreisflaeche, { r: 2 })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(formatResult(result.value)).toBe('12.5663706144')
    }
  })

  it('wertet den Kreisumfang für r=3 aus', () => {
    const result = evaluateFormula(kreisumfang, { r: 3 })

    expect(result).toEqual({ ok: true, value: 2 * Math.PI * 3 })
  })

  it('wertet die Rechteckfläche für a=4, b=5 aus', () => {
    const result = evaluateFormula(rechteckflaeche, { a: 4, b: 5 })

    expect(result).toEqual({ ok: true, value: 20 })
  })

  it('wertet die Hypotenuse für a=3, b=4 aus', () => {
    const result = evaluateFormula(pythagoras, { a: 3, b: 4 })

    expect(result).toEqual({ ok: true, value: 5 })
  })

  it('wertet das Ohmsche Gesetz für I=2, R=10 aus', () => {
    const result = evaluateFormula(ohmschesGesetz, { I: 2, R: 10 })

    expect(result).toEqual({ ok: true, value: 20 })
  })

  it('wertet das Würfelvolumen für a=3 aus', () => {
    const result = evaluateFormula(wuerfelvolumen, { a: 3 })

    expect(result).toEqual({ ok: true, value: 27 })
  })

  it('meldet eine fehlende Variable mit ihrem Namen', () => {
    const result = evaluateFormula(kreisflaeche, {})

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.type).toBe('missing-variable')
      expect(result.error.variable).toBe('r')
      expect(result.error.message).toContain('r')
    }
  })

  it('meldet die erste fehlende Variable, wenn mehrere fehlen', () => {
    const result = evaluateFormula(rechteckflaeche, { b: 5 })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.type).toBe('missing-variable')
      expect(result.error.variable).toBe('a')
    }
  })

  it('lehnt einen negativen Radius außerhalb des Wertebereichs ab', () => {
    const result = evaluateFormula(kreisflaeche, { r: -1 })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.type).toBe('out-of-range')
      expect(result.error.variable).toBe('r')
      expect(result.error.message).toContain('r')
    }
  })

  it('lehnt einen Wert oberhalb der oberen Wertebereichsgrenze ab', () => {
    const result = evaluateFormula(wuerfelvolumen, { a: 200 })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.type).toBe('out-of-range')
      expect(result.error.variable).toBe('a')
    }
  })

  it('akzeptiert Grenzwerte des Wertebereichs (inklusiv)', () => {
    expect(evaluateFormula(kreisflaeche, { r: 0 })).toEqual({
      ok: true,
      value: 0,
    })
    expect(evaluateFormula(wuerfelvolumen, { a: 100 })).toEqual({
      ok: true,
      value: 1e6,
    })
  })

  it('erlaubt Variablen ohne definierten Wertebereich', () => {
    const result = evaluateFormula(ohmschesGesetz, { I: -2, R: 5 })

    expect(result).toEqual({ ok: true, value: -10 })
  })

  it('reicht Auswertungsfehler der Engine durch (z. B. Division durch Null)', () => {
    const formula: Formula = {
      ...ohmschesGesetz,
      id: 'division-durch-null',
      expression: 'I/R',
    }

    const result = evaluateFormula(formula, { I: 5, R: 0 })

    expect(result).toEqual({
      ok: false,
      error: { type: 'evaluation-error', message: 'Division durch Null' },
    })
  })

  it('lehnt ein Ergebnis ab, das durch Überlauf zu Infinity wird', () => {
    const result = evaluateFormula(kreisflaeche, { r: 1e308 })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.type).toBe('evaluation-error')
    }
  })
})
