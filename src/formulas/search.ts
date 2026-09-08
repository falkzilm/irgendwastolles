import type { Formula } from './types'

/**
 * Prüft, ob eine Formel zu einer Textsuche passt (Titel oder Beschreibung,
 * Groß-/Kleinschreibung wird ignoriert). Eine leere Suche trifft auf jede
 * Formel zu.
 */
export function matchesQuery(formula: Formula, query: string): boolean {
  const normalized = query.trim().toLowerCase()
  if (normalized === '') return true
  return (
    formula.title.toLowerCase().includes(normalized) ||
    formula.description.toLowerCase().includes(normalized)
  )
}

/**
 * Filtert einen Formelkatalog nach Textsuche (Titel/Beschreibung) und
 * optional nach Favoriten (IRGENDWAST-33).
 */
export function filterFormulas(
  formulas: Formula[],
  query: string,
  options: { favoritesOnly: boolean; favoritenIds: string[] },
): Formula[] {
  return formulas.filter(
    (formula) =>
      matchesQuery(formula, query) &&
      (!options.favoritesOnly || options.favoritenIds.includes(formula.id)),
  )
}
