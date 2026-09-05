/**
 * Interne Fehlerklassen der Engine. Sie werden ausschließlich innerhalb von
 * `src/engine` geworfen und von `evaluate()` (siehe `index.ts`) abgefangen
 * und in ein typisiertes `EngineResult` übersetzt - nach außen dringt keine
 * Exception.
 */
export class EngineSyntaxError extends Error {
  position: number

  constructor(message: string, position: number) {
    super(message)
    this.name = 'EngineSyntaxError'
    this.position = position
  }
}

export class EngineEvaluationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EngineEvaluationError'
  }
}
