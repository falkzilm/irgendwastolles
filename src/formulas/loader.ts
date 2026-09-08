import { FORMULA_CATEGORIES } from './types'
import type { Formula, FormulaCategory, FormulaVariable } from './types'

export interface CatalogError {
  /** Formel-id des fehlerhaften Eintrags, oder `#<index>`, falls die id selbst fehlt/ungültig ist. */
  id: string
  message: string
}

export type CatalogLoadResult =
  { ok: true; formulas: Formula[] } | { ok: false; errors: CatalogError[] }

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isCategory(value: unknown): value is FormulaCategory {
  return (
    typeof value === 'string' &&
    (FORMULA_CATEGORIES as readonly string[]).includes(value)
  )
}

function validateVariable(
  entry: unknown,
  formulaId: string,
  index: number,
  errors: CatalogError[],
): FormulaVariable | undefined {
  if (typeof entry !== 'object' || entry === null) {
    errors.push({
      id: formulaId,
      message: `Variable #${index} ist kein Objekt`,
    })
    return undefined
  }

  const v = entry as Record<string, unknown>
  let valid = true

  if (!isNonEmptyString(v.name)) {
    errors.push({
      id: formulaId,
      message: `Variable #${index}: Feld "name" fehlt oder ist ungültig`,
    })
    valid = false
  }
  if (typeof v.unit !== 'string') {
    errors.push({
      id: formulaId,
      message: `Variable #${index}: Feld "unit" fehlt oder ist ungültig`,
    })
    valid = false
  }

  let range: FormulaVariable['range']
  if (v.range !== undefined) {
    if (typeof v.range !== 'object' || v.range === null) {
      errors.push({
        id: formulaId,
        message: `Variable #${index}: Feld "range" ist ungültig`,
      })
      valid = false
    } else {
      const { min, max } = v.range as Record<string, unknown>
      if (min !== undefined && typeof min !== 'number') {
        errors.push({
          id: formulaId,
          message: `Variable #${index}: "range.min" muss eine Zahl sein`,
        })
        valid = false
      }
      if (max !== undefined && typeof max !== 'number') {
        errors.push({
          id: formulaId,
          message: `Variable #${index}: "range.max" muss eine Zahl sein`,
        })
        valid = false
      }
      if (typeof min === 'number' && typeof max === 'number' && min > max) {
        errors.push({
          id: formulaId,
          message: `Variable #${index}: "range.min" darf nicht größer als "range.max" sein`,
        })
        valid = false
      }
      if (valid) {
        range = {
          min: min as number | undefined,
          max: max as number | undefined,
        }
      }
    }
  }

  if (!valid) return undefined
  return { name: v.name as string, unit: v.unit as string, range }
}

function validateFormula(
  entry: unknown,
  fallbackId: string,
  errors: CatalogError[],
): Formula | undefined {
  if (typeof entry !== 'object' || entry === null) {
    errors.push({ id: fallbackId, message: 'Formel ist kein Objekt' })
    return undefined
  }

  const f = entry as Record<string, unknown>
  const id = isNonEmptyString(f.id) ? f.id : fallbackId
  let valid = true

  if (!isNonEmptyString(f.id)) {
    errors.push({ id, message: 'Feld "id" fehlt oder ist ungültig' })
    valid = false
  }
  if (!isNonEmptyString(f.title)) {
    errors.push({ id, message: 'Feld "title" fehlt oder ist ungültig' })
    valid = false
  }
  if (!isCategory(f.category)) {
    errors.push({
      id,
      message: `Feld "category" fehlt oder ist ungültig (erlaubt: ${FORMULA_CATEGORIES.join(', ')})`,
    })
    valid = false
  }
  if (!isNonEmptyString(f.description)) {
    errors.push({ id, message: 'Feld "description" fehlt oder ist ungültig' })
    valid = false
  }
  if (!isNonEmptyString(f.latex)) {
    errors.push({ id, message: 'Feld "latex" fehlt oder ist ungültig' })
    valid = false
  }
  if (!isNonEmptyString(f.expression)) {
    errors.push({ id, message: 'Feld "expression" fehlt oder ist ungültig' })
    valid = false
  }
  if (!isNonEmptyString(f.source)) {
    errors.push({ id, message: 'Feld "source" fehlt oder ist ungültig' })
    valid = false
  }

  const variables: FormulaVariable[] = []
  if (!Array.isArray(f.variables)) {
    errors.push({ id, message: 'Feld "variables" fehlt oder ist kein Array' })
    valid = false
  } else {
    f.variables.forEach((variable, i) => {
      const validated = validateVariable(variable, id, i, errors)
      if (validated) {
        variables.push(validated)
      } else {
        valid = false
      }
    })
  }

  if (!valid) return undefined
  return {
    id,
    title: f.title as string,
    category: f.category as FormulaCategory,
    description: f.description as string,
    latex: f.latex as string,
    expression: f.expression as string,
    source: f.source as string,
    variables,
  }
}

/**
 * Lädt und validiert einen Formel-Katalog aus rohen (z. B. per JSON
 * eingelesenen) Daten. Liefert bei ungültigen oder fehlenden Feldern sowie
 * bei doppelten Formel-ids `{ ok: false, errors }` statt eine Exception zu
 * werfen - jeder Fehler trägt die betroffene Formel-id (oder `#<index>`,
 * falls die id selbst fehlt/ungültig ist), damit sich der Katalogeintrag
 * eindeutig zuordnen lässt.
 */
export function loadCatalog(data: unknown): CatalogLoadResult {
  if (!Array.isArray(data)) {
    return {
      ok: false,
      errors: [
        { id: '#0', message: 'Katalog muss ein Array von Formeln sein' },
      ],
    }
  }

  const idCounts = new Map<string, number>()
  data.forEach((entry) => {
    if (typeof entry === 'object' && entry !== null) {
      const id = (entry as Record<string, unknown>).id
      if (isNonEmptyString(id)) {
        idCounts.set(id, (idCounts.get(id) ?? 0) + 1)
      }
    }
  })

  const errors: CatalogError[] = []
  const formulas: Formula[] = []

  data.forEach((entry, index) => {
    const entryErrors: CatalogError[] = []
    const formula = validateFormula(entry, `#${index}`, entryErrors)

    const rawId =
      typeof entry === 'object' && entry !== null
        ? (entry as Record<string, unknown>).id
        : undefined
    if (isNonEmptyString(rawId) && (idCounts.get(rawId) ?? 0) > 1) {
      entryErrors.push({
        id: rawId,
        message: `Doppelte Formel-id "${rawId}"`,
      })
    }

    errors.push(...entryErrors)
    if (formula && entryErrors.length === 0) {
      formulas.push(formula)
    }
  })

  return errors.length > 0 ? { ok: false, errors } : { ok: true, formulas }
}
