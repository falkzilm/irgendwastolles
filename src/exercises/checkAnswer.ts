import type { Exercise } from './types'

/**
 * Prüft eine eingegebene Antwort gegen `exercise.answer`.
 *
 * Akzeptiert wird jeder Wert, dessen absolute Abweichung `exercise.tolerance`
 * nicht überschreitet (inklusiv) - das deckt Rundungsdifferenzen bei
 * Prozent- und Formelaufgaben ab, ohne dass Aufrufer die Toleranz kennen
 * müssen. `toleranceOverride` erlaubt es, testweise oder für eine großzügigere
 * UI eine abweichende Toleranz zu verwenden. Nicht-endliche Werte (z. B.
 * `NaN`) werden immer abgelehnt.
 */
export function checkAnswer(
  exercise: Exercise,
  given: number,
  toleranceOverride?: number,
): boolean {
  if (!Number.isFinite(given)) {
    return false
  }

  const tolerance = toleranceOverride ?? exercise.tolerance
  return Math.abs(given - exercise.answer) <= tolerance
}
