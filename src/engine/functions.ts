import { EngineEvaluationError } from './errors'
import type { AngleMode } from './types'

/** Bekannte Konstanten, die als bloße Bezeichner (ohne Klammern) erlaubt sind. */
export const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
}

function toRadians(value: number, angleMode: AngleMode): number {
  return angleMode === 'deg' ? (value * Math.PI) / 180 : value
}

function fromRadians(value: number, angleMode: AngleMode): number {
  return angleMode === 'deg' ? (value * 180) / Math.PI : value
}

function factorial(value: number): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new EngineEvaluationError(
      'Fakultät ist nur für nicht-negative ganze Zahlen definiert',
    )
  }
  let result = 1
  for (let i = 2; i <= value; i++) {
    result *= i
  }
  return result
}

/**
 * Wissenschaftliche Ein-Argument-Funktionen. `angleMode` steuert für die
 * trigonometrischen Funktionen, ob Winkel in Grad oder Radiant interpretiert
 * (`sin`/`cos`/`tan`) bzw. zurückgegeben (`asin`/`acos`/`atan`) werden - alle
 * anderen Funktionen sind vom Winkelmodus unabhängig.
 */
export const FUNCTIONS: Record<
  string,
  (arg: number, angleMode: AngleMode) => number
> = {
  sin: (arg, angleMode) => Math.sin(toRadians(arg, angleMode)),
  cos: (arg, angleMode) => Math.cos(toRadians(arg, angleMode)),
  tan: (arg, angleMode) => Math.tan(toRadians(arg, angleMode)),
  asin: (arg, angleMode) => fromRadians(Math.asin(arg), angleMode),
  acos: (arg, angleMode) => fromRadians(Math.acos(arg), angleMode),
  atan: (arg, angleMode) => fromRadians(Math.atan(arg), angleMode),
  log: (arg) => Math.log10(arg),
  ln: (arg) => Math.log(arg),
  exp: (arg) => Math.exp(arg),
  sqrt: (arg) => Math.sqrt(arg),
  abs: (arg) => Math.abs(arg),
  fact: (arg) => factorial(arg),
}
