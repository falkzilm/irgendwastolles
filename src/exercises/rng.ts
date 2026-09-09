/**
 * Deterministischer Pseudozufallszahlengenerator (mulberry32): liefert bei
 * gleichem `seed` exakt dieselbe Folge von Zahlen in `[0, 1)`, unabhängig von
 * Plattform oder Laufzeit. Grundlage für die reproduzierbaren Aufgabenfolgen
 * des Aufgabengenerators (`generator.ts`).
 */
export type Rng = () => number

export function createRng(seed: number): Rng {
  let state = seed >>> 0

  return function rng() {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Ganzzahl im Bereich `[min, max]` (beide Grenzen inklusiv). */
export function randomInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min
}

/** Wählt zufällig ein Element aus `items` (nicht-leer). */
export function pickOne<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]
}
