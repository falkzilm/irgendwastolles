import { describe, expect, it } from 'vitest'
import { evaluate } from '../engine'
import rawCatalog from './catalog.json'
import { loadCatalog } from './loader'
import type { Formula } from './types'

/**
 * Setzt die Beispielwerte für jede Variable in `expression` ein, damit sich
 * das Beispiel mit der Rechen-Engine auswerten lässt. Variablennamen sind
 * per Tokenizer reine Buchstabenfolgen (siehe `docs/engine.md`), daher
 * genügt ein Wortgrenzen-Ersetzen je Variable.
 */
function substituteVariables(
  expression: string,
  values: Record<string, number>,
): string {
  return Object.entries(values).reduce(
    (expr, [name, value]) =>
      expr.replace(new RegExp(`\\b${name}\\b`, 'g'), `(${value})`),
    expression,
  )
}

describe('Formel-Katalog', () => {
  const result = loadCatalog(rawCatalog)

  it('validiert alle Katalogeinträge fehlerfrei', () => {
    if (!result.ok) {
      console.error(result.errors)
    }
    expect(result.ok).toBe(true)
  })

  const formulas: Formula[] = result.ok ? result.formulas : []

  it('enthält mindestens 30 Formeln', () => {
    expect(formulas.length).toBeGreaterThanOrEqual(30)
  })

  it('deckt mindestens 4 Kategorien ab', () => {
    const categories = new Set(formulas.map((formula) => formula.category))
    expect(categories.size).toBeGreaterThanOrEqual(4)
  })

  it.each(formulas.map((formula) => ({ id: formula.id, formula })))(
    '$id: hat Titel, Kategorie, Erklärtext, LaTeX, Ausdruck und vollständige Variablenliste',
    ({ formula }) => {
      expect(formula.title.trim()).not.toBe('')
      expect(formula.category.trim()).not.toBe('')
      expect(formula.description.trim()).not.toBe('')
      expect(formula.latex.trim()).not.toBe('')
      expect(formula.expression.trim()).not.toBe('')
      expect(formula.variables.length).toBeGreaterThan(0)
    },
  )

  it.each(
    formulas.flatMap((formula) =>
      formula.examples.map((example, index) => ({
        label: `${formula.id} Beispiel #${index}`,
        formula,
        example,
      })),
    ),
  )(
    '$label: expression ergibt bei den Beispielwerten das erwartete Ergebnis',
    ({ formula, example }) => {
      const substituted = substituteVariables(
        formula.expression,
        example.values,
      )
      const evaluation = evaluate(substituted)

      expect(evaluation.ok).toBe(true)
      if (evaluation.ok) {
        expect(evaluation.value).toBeCloseTo(example.expected, 9)
      }
    },
  )
})
