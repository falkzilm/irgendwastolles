/**
 * Schwierigkeitsstufen des Aufgabengenerators, aufsteigend sortiert.
 */
export const DIFFICULTIES = ['leicht', 'mittel', 'schwer'] as const

export type Difficulty = (typeof DIFFICULTIES)[number]

/**
 * Aufgabenkategorien: Grundrechenarten, Prozentrechnung und einfache
 * Formelanwendungen (Flächenformeln), siehe `docs/exercises.md`.
 */
export const EXERCISE_CATEGORIES = [
  'grundrechenarten',
  'prozent',
  'formel',
] as const

export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number]

/**
 * Eine einzelne generierte Rechenaufgabe.
 *
 * `tolerance` ist die bei dieser Aufgabe erlaubte Abweichung zwischen
 * eingegebener und korrekter Lösung (siehe `checkAnswer()` in
 * `checkAnswer.ts`); Aufgaben mit ganzzahligem Ergebnis haben `tolerance: 0`.
 */
export interface Exercise {
  id: string
  category: ExerciseCategory
  difficulty: Difficulty
  prompt: string
  answer: number
  tolerance: number
}
