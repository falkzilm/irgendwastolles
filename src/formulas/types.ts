/**
 * Kategorien, in die Formeln im Katalog eingeordnet werden.
 * Neue Kategorien werden hier ergänzt statt als freier String im Katalog
 * zugelassen, damit ungültige Kategorienamen beim Laden auffallen.
 */
export const FORMULA_CATEGORIES = [
  'algebra',
  'geometrie',
  'trigonometrie',
  'analysis',
  'physik',
  'stochastik',
  'sonstiges',
] as const

export type FormulaCategory = (typeof FORMULA_CATEGORIES)[number]

/**
 * Wertebereich einer Formel-Variablen. Beide Grenzen sind optional und
 * inklusiv; fehlt eine Grenze, ist die Variable in diese Richtung
 * unbeschränkt.
 */
export interface FormulaVariableRange {
  min?: number
  max?: number
}

export interface FormulaVariable {
  /** Bezeichner der Variablen im `expression`, z. B. `r` für den Radius. */
  name: string
  /** Einheit der Variablen, z. B. `m` oder `°C`. Leerstring für einheitenlose Größen. */
  unit: string
  range?: FormulaVariableRange
}

/**
 * Ein Rechenbeispiel für eine Formel: eine konkrete Variablenbelegung mit dem
 * dabei erwarteten Ergebnis von `expression`. Dient sowohl der Dokumentation
 * als auch als Testfall im Katalog-Test (siehe `docs/formulas.md`).
 */
export interface FormulaExample {
  /** Werte für jede Variable aus `variables`, indiziert nach Variablenname. */
  values: Record<string, number>
  /** Erwartetes Ergebnis von `expression` bei dieser Variablenbelegung. */
  expected: number
}

/**
 * Eine einzelne Formel im Katalog.
 *
 * `expression` folgt der Syntax der Rechen-Engine (siehe `docs/engine.md`)
 * und referenziert die Namen aus `variables`, damit künftige Engine-Items
 * (z. B. Formel-Auswertung mit Variablenbelegung) direkt darauf aufbauen
 * können.
 */
export interface Formula {
  id: string
  title: string
  category: FormulaCategory
  description: string
  /** LaTeX-Darstellung der Formel, z. B. `A = \\pi r^2`. */
  latex: string
  expression: string
  variables: FormulaVariable[]
  /** Mindestens ein Rechenbeispiel mit erwartetem Ergebnis. */
  examples: FormulaExample[]
  /** Quelle/Herkunft der Formel, z. B. Lehrbuch oder Normenreferenz. */
  source: string
  /**
   * Beispielwertsatz für die Detailansicht (IRGENDWAST-34): ordnet jedem
   * Variablennamen aus `variables` einen sinnvollen Beispielwert zu, der
   * sich per Klick in die Eingabefelder übernehmen lässt. Optional, damit
   * bestehende `Formula`-Werte ohne dieses Feld gültig bleiben.
   */
  example?: Record<string, number>
}
