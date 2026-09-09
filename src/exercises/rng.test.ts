import { describe, expect, it } from 'vitest'
import { createRng, pickOne, randomInt } from './rng'

describe('createRng', () => {
  it('liefert bei gleichem Seed dieselbe Zahlenfolge', () => {
    const a = createRng(123)
    const b = createRng(123)

    const sequenceA = Array.from({ length: 20 }, () => a())
    const sequenceB = Array.from({ length: 20 }, () => b())

    expect(sequenceB).toEqual(sequenceA)
  })

  it('liefert bei unterschiedlichem Seed unterschiedliche Zahlenfolgen', () => {
    const a = createRng(1)
    const b = createRng(2)

    const sequenceA = Array.from({ length: 10 }, () => a())
    const sequenceB = Array.from({ length: 10 }, () => b())

    expect(sequenceB).not.toEqual(sequenceA)
  })

  it('liefert Werte im Intervall [0, 1)', () => {
    const rng = createRng(7)

    for (let i = 0; i < 200; i += 1) {
      const value = rng()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})

describe('randomInt', () => {
  it('liefert nur Werte innerhalb des angegebenen Bereichs (inklusiv)', () => {
    const rng = createRng(55)

    for (let i = 0; i < 200; i += 1) {
      const value = randomInt(rng, 3, 7)
      expect(value).toBeGreaterThanOrEqual(3)
      expect(value).toBeLessThanOrEqual(7)
      expect(Number.isInteger(value)).toBe(true)
    }
  })
})

describe('pickOne', () => {
  it('wählt ausschließlich Elemente aus der übergebenen Liste', () => {
    const rng = createRng(9)
    const items = ['a', 'b', 'c'] as const

    for (let i = 0; i < 50; i += 1) {
      expect(items).toContain(pickOne(rng, items))
    }
  })
})
