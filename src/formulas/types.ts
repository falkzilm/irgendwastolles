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
  /** Quelle/Herkunft der Formel, z. B. Lehrbuch oder Normenreferenz. */
  source: string
}
