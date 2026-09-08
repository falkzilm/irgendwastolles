import rawCatalog from './catalog.json'
import { loadCatalog } from './loader'
import type { Formula } from './types'

const result = loadCatalog(rawCatalog)

if (!result.ok) {
  throw new Error(
    `Formel-Katalog ist ungültig: ${result.errors
      .map((error) => `${error.id}: ${error.message}`)
      .join('; ')}`,
  )
}

/** Der kuratierte Startkatalog, bereits gegen das Formel-Schema validiert. */
export const FORMULA_CATALOG: Formula[] = result.formulas
