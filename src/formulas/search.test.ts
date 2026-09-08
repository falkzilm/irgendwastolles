import { describe, expect, it } from 'vitest'
import { filterFormulas, matchesQuery } from './search'
import type { Formula } from './types'

const kreisflaeche: Formula = {
  id: 'kreisflaeche',
  title: 'Kreisfläche',
  category: 'geometrie',
  description: 'Fläche eines Kreises aus dem Radius',
  latex: 'A = \\pi r^2',
  expression: 'pi*r^2',
  variables: [{ name: 'r', unit: 'm', range: { min: 0 } }],
  examples: [{ values: { r: 2 }, expected: 12.566370614359172 }],
  source: 'Schulbuch Mathematik Sek I',
}

const satzDesPythagoras: Formula = {
  id: 'satz-des-pythagoras',
  title: 'Satz des Pythagoras',
  category: 'trigonometrie',
  description: 'Zusammenhang der Seitenlängen im rechtwinkligen Dreieck',
  latex: 'c = \\sqrt{a^2 + b^2}',
  expression: 'sqrt(a^2+b^2)',
  variables: [
    { name: 'a', unit: 'm' },
    { name: 'b', unit: 'm' },
  ],
  examples: [{ values: { a: 3, b: 4 }, expected: 5 }],
  source: 'Schulbuch Mathematik Sek I',
}

describe('matchesQuery', () => {
  it('trifft bei leerer Suche auf jede Formel zu', () => {
    expect(matchesQuery(kreisflaeche, '')).toBe(true)
    expect(matchesQuery(kreisflaeche, '   ')).toBe(true)
  })

  it('findet Treffer im Titel unabhängig von Groß-/Kleinschreibung', () => {
    expect(matchesQuery(kreisflaeche, 'kreisFLÄCHE')).toBe(true)
  })

  it('findet Treffer in der Beschreibung', () => {
    expect(matchesQuery(satzDesPythagoras, 'rechtwinkligen Dreieck')).toBe(true)
  })

  it('liefert false ohne Treffer in Titel oder Beschreibung', () => {
    expect(matchesQuery(kreisflaeche, 'Integral')).toBe(false)
  })
})

describe('filterFormulas', () => {
  const formulas = [kreisflaeche, satzDesPythagoras]

  it('filtert nach Textsuche', () => {
    const result = filterFormulas(formulas, 'Pythagoras', {
      favoritesOnly: false,
      favoritenIds: [],
    })

    expect(result).toEqual([satzDesPythagoras])
  })

  it('filtert zusätzlich auf Favoriten, wenn favoritesOnly aktiv ist', () => {
    const result = filterFormulas(formulas, '', {
      favoritesOnly: true,
      favoritenIds: ['kreisflaeche'],
    })

    expect(result).toEqual([kreisflaeche])
  })

  it('reagiert bei 30 Katalogeinträgen in unter 200ms auf eine Sucheingabe', () => {
    const largeCatalog: Formula[] = Array.from({ length: 30 }, (_, i) => ({
      ...kreisflaeche,
      id: `formel-${i}`,
      title: `Formel ${i}`,
      description: `Beschreibung Nummer ${i}`,
    }))

    const start = performance.now()
    const result = filterFormulas(largeCatalog, 'Formel 2', {
      favoritesOnly: false,
      favoritenIds: [],
    })
    const duration = performance.now() - start

    expect(duration).toBeLessThan(200)
    expect(result.length).toBeGreaterThan(0)
  })
})
