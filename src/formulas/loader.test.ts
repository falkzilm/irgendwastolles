import { describe, expect, it } from 'vitest'
import { loadCatalog } from './loader'
import type { Formula } from './types'

const kreisflaeche: Formula = {
  id: 'kreisflaeche',
  title: 'Kreisfläche',
  category: 'geometrie',
  description: 'Fläche eines Kreises aus dem Radius',
  latex: 'A = \\pi r^2',
  expression: 'pi*r^2',
  variables: [{ name: 'r', unit: 'm', range: { min: 0 } }],
  source: 'Schulbuch Mathematik Sek I',
}

describe('loadCatalog', () => {
  it('lädt einen validen Katalog', () => {
    const result = loadCatalog([kreisflaeche])

    expect(result).toEqual({ ok: true, formulas: [kreisflaeche] })
  })

  it('akzeptiert Variablen ohne range', () => {
    const formula: Formula = {
      ...kreisflaeche,
      id: 'ohne-range',
      variables: [{ name: 'r', unit: 'm' }],
    }

    const result = loadCatalog([formula])

    expect(result).toEqual({ ok: true, formulas: [formula] })
  })

  it('lehnt einen Katalog ab, der kein Array ist', () => {
    const result = loadCatalog({ not: 'an array' })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors).toHaveLength(1)
    }
  })

  it('meldet fehlende Pflichtfelder mit der Formel-id', () => {
    const result = loadCatalog([{ id: 'kreisflaeche', title: 'Kreisfläche' }])

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.every((error) => error.id === 'kreisflaeche')).toBe(
        true,
      )
      expect(
        result.errors.some((error) => error.message.includes('category')),
      ).toBe(true)
    }
  })

  it('fällt für die id auf den Index zurück, wenn die id selbst fehlt', () => {
    const result = loadCatalog([{ title: 'Ohne id' }])

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((error) => error.id === '#0')).toBe(true)
    }
  })

  it('meldet eine ungültige Kategorie', () => {
    const result = loadCatalog([
      { ...kreisflaeche, category: 'nicht-existent' },
    ])

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(
        result.errors.some((error) => error.message.includes('category')),
      ).toBe(true)
    }
  })

  it('meldet eine ungültige Variable', () => {
    const result = loadCatalog([
      { ...kreisflaeche, variables: [{ name: 'r' }] },
    ])

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(
        result.errors.some((error) => error.message.includes('unit')),
      ).toBe(true)
    }
  })

  it('meldet ein ungültiges Wertebereich (min > max)', () => {
    const result = loadCatalog([
      {
        ...kreisflaeche,
        variables: [{ name: 'r', unit: 'm', range: { min: 10, max: 0 } }],
      },
    ])

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(
        result.errors.some((error) => error.message.includes('range')),
      ).toBe(true)
    }
  })

  it('erkennt doppelte Formel-ids als Fehler', () => {
    const result = loadCatalog([kreisflaeche, kreisflaeche])

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(
        result.errors.some(
          (error) =>
            error.id === 'kreisflaeche' &&
            error.message.includes('Doppelte Formel-id'),
        ),
      ).toBe(true)
    }
  })
})
