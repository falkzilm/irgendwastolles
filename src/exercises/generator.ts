import { createRng, pickOne, randomInt } from './rng'
import type { Rng } from './rng'
import { EXERCISE_CATEGORIES } from './types'
import type { Difficulty, Exercise, ExerciseCategory } from './types'

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

type BinaryOperator = '+' | '-' | '*' | '/'

const OPERATORS_BY_DIFFICULTY: Record<Difficulty, readonly BinaryOperator[]> = {
  leicht: ['+', '-'],
  mittel: ['+', '-', '*'],
  schwer: ['+', '-', '*', '/'],
}

const OPERAND_RANGE_BY_DIFFICULTY: Record<
  Difficulty,
  { min: number; max: number }
> = {
  leicht: { min: 1, max: 20 },
  mittel: { min: 10, max: 100 },
  schwer: { min: 10, max: 500 },
}

/**
 * Erzeugt eine Grundrechenarten-Aufgabe (`+ - * /`). Operator und
 * Zahlenbereich hängen von `difficulty` ab; Subtraktion liefert nie ein
 * negatives Ergebnis, Division geht immer restlos auf (beide, damit die
 * Aufgabe ohne Dezimalzahlen und ohne negative Zwischenergebnisse lösbar
 * bleibt).
 */
function generateGrundrechenartenExercise(
  rng: Rng,
  difficulty: Difficulty,
  id: string,
): Exercise {
  const operator = pickOne(rng, OPERATORS_BY_DIFFICULTY[difficulty])
  const { min, max } = OPERAND_RANGE_BY_DIFFICULTY[difficulty]

  let a: number
  let b: number
  let answer: number

  if (operator === '/') {
    b = randomInt(rng, 2, Math.max(2, Math.floor(max / 10)))
    const quotient = randomInt(rng, min, Math.max(min, Math.floor(max / b)))
    a = b * quotient
    answer = quotient
  } else if (operator === '-') {
    a = randomInt(rng, min, max)
    b = randomInt(rng, min, a)
    answer = a - b
  } else if (operator === '*') {
    const factorMax = Math.max(2, Math.floor(Math.sqrt(max)))
    a = randomInt(rng, 2, factorMax)
    b = randomInt(rng, 2, factorMax)
    answer = a * b
  } else {
    a = randomInt(rng, min, max)
    b = randomInt(rng, min, max)
    answer = a + b
  }

  return {
    id,
    category: 'grundrechenarten',
    difficulty,
    prompt: `${a} ${operator} ${b} = ?`,
    answer,
    tolerance: 0,
  }
}

const PERCENT_POOL_BY_DIFFICULTY: Record<Difficulty, readonly number[]> = {
  leicht: [10, 20, 25, 50],
  mittel: [5, 15, 30, 40, 60, 75],
  schwer: [12, 18, 33, 45, 67, 82],
}

const BASE_RANGE_BY_DIFFICULTY: Record<
  Difficulty,
  { min: number; max: number }
> = {
  leicht: { min: 10, max: 100 },
  mittel: { min: 50, max: 500 },
  schwer: { min: 100, max: 2000 },
}

/**
 * Erzeugt eine Prozentrechnung-Aufgabe: entweder "Wie viel sind p% von b?"
 * oder (ab `mittel`) eine Erhöhung um p% von b. Das Ergebnis wird auf 2
 * Nachkommastellen gerundet, `tolerance: 0.01` deckt Rundungsdifferenzen bei
 * der Antwortprüfung ab.
 */
function generateProzentExercise(
  rng: Rng,
  difficulty: Difficulty,
  id: string,
): Exercise {
  const percent = pickOne(rng, PERCENT_POOL_BY_DIFFICULTY[difficulty])
  const { min, max } = BASE_RANGE_BY_DIFFICULTY[difficulty]
  const base = randomInt(rng, min, max)
  const variant =
    difficulty === 'leicht'
      ? 'anteil'
      : pickOne(rng, ['anteil', 'erhoehung'] as const)

  if (variant === 'erhoehung') {
    return {
      id,
      category: 'prozent',
      difficulty,
      prompt: `Ein Betrag von ${base} wird um ${percent}% erhöht. Wie hoch ist der neue Betrag?`,
      answer: round2(base * (1 + percent / 100)),
      tolerance: 0.01,
    }
  }

  return {
    id,
    category: 'prozent',
    difficulty,
    prompt: `Wie viel sind ${percent}% von ${base}?`,
    answer: round2((base * percent) / 100),
    tolerance: 0.01,
  }
}

const DIMENSION_RANGE_BY_DIFFICULTY: Record<
  Difficulty,
  { min: number; max: number }
> = {
  leicht: { min: 1, max: 10 },
  mittel: { min: 2, max: 30 },
  schwer: { min: 2, max: 100 },
}

const SHAPES = ['rechteck', 'kreis', 'dreieck'] as const

/**
 * Erzeugt eine einfache Formelanwendung (Flächenberechnung) für Rechteck,
 * Kreis oder Dreieck. Kreisflächen nutzen `Math.PI` und werden gerundet
 * (`tolerance: 0.01`); Rechteck und Dreieck mit ganzzahligen Seiten liefern
 * exakte Ergebnisse.
 */
function generateFormelExercise(
  rng: Rng,
  difficulty: Difficulty,
  id: string,
): Exercise {
  const { min, max } = DIMENSION_RANGE_BY_DIFFICULTY[difficulty]
  const shape = pickOne(rng, SHAPES)

  if (shape === 'kreis') {
    const r = randomInt(rng, min, max)
    return {
      id,
      category: 'formel',
      difficulty,
      prompt: `Berechne die Fläche eines Kreises mit dem Radius ${r} (A = π·r²). Runde auf 2 Nachkommastellen.`,
      answer: round2(Math.PI * r * r),
      tolerance: 0.01,
    }
  }

  if (shape === 'dreieck') {
    const g = randomInt(rng, min, max)
    const h = randomInt(rng, min, max)
    return {
      id,
      category: 'formel',
      difficulty,
      prompt: `Berechne die Fläche eines Dreiecks mit der Grundseite ${g} und der Höhe ${h} (A = g·h/2).`,
      answer: round2((g * h) / 2),
      tolerance: 0.01,
    }
  }

  const a = randomInt(rng, min, max)
  const b = randomInt(rng, min, max)
  return {
    id,
    category: 'formel',
    difficulty,
    prompt: `Berechne die Fläche eines Rechtecks mit den Seiten ${a} und ${b} (A = a·b).`,
    answer: a * b,
    tolerance: 0,
  }
}

const GENERATORS: Record<
  ExerciseCategory,
  (rng: Rng, difficulty: Difficulty, id: string) => Exercise
> = {
  grundrechenarten: generateGrundrechenartenExercise,
  prozent: generateProzentExercise,
  formel: generateFormelExercise,
}

export interface GenerateExercisesOptions {
  /** Startwert des deterministischen Zufallsgenerators, siehe `rng.ts`. */
  seed: number
  /** Anzahl zu erzeugender Aufgaben. */
  count: number
  difficulty: Difficulty
  /** Einzubeziehende Kategorien, Standard: alle `EXERCISE_CATEGORIES`. */
  categories?: readonly ExerciseCategory[]
}

/**
 * Erzeugt `count` Aufgaben für `difficulty`. Bei gleichem `seed` (und
 * gleichen übrigen Optionen) liefert der Generator reproduzierbar dieselbe
 * Aufgabenfolge, da sämtlicher Zufall aus dem seedbasierten `Rng` aus
 * `rng.ts` gezogen wird (siehe `docs/exercises.md`).
 */
export function generateExercises(
  options: GenerateExercisesOptions,
): Exercise[] {
  const { seed, count, difficulty, categories = EXERCISE_CATEGORIES } = options

  if (categories.length === 0) {
    throw new Error('categories darf nicht leer sein')
  }

  if (!Number.isSafeInteger(count) || count < 0) {
    throw new Error('count muss eine nichtnegative ganze Zahl sein')
  }

  const rng = createRng(seed)
  const exercises: Exercise[] = []

  for (let i = 0; i < count; i += 1) {
    const category = pickOne(rng, categories)
    const id = `${difficulty}-${category}-${i}`
    exercises.push(GENERATORS[category](rng, difficulty, id))
  }

  return exercises
}
