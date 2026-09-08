import { useMemo, useState } from 'react'
import './FormulasPage.css'
import { Card } from '../ui/Card'
import { useAppStore } from '../store'
import { FormulaDetail } from './formulas/FormulaDetail'
import {
  FORMULA_CATALOG,
  FORMULA_CATEGORIES,
  filterFormulas,
} from '../formulas'
import type { Formula, FormulaCategory } from '../formulas'

const CATEGORY_LABELS: Record<FormulaCategory, string> = {
  algebra: 'Algebra',
  geometrie: 'Geometrie',
  trigonometrie: 'Trigonometrie',
  analysis: 'Analysis',
  physik: 'Physik',
  stochastik: 'Stochastik',
  sonstiges: 'Sonstiges',
}

/**
 * Formelbrowser (IRGENDWAST-33): Textsuche über Titel/Beschreibung sowie ein
 * Favoriten-Filter grenzen `FORMULA_CATALOG` ein, das Ergebnis wird nach
 * `FORMULA_CATEGORIES` gruppiert dargestellt. Favoriten leben im
 * `favoritenSlice` und werden wie `verlauf` über `src/store/persistence.ts`
 * persistiert, siehe docs/state.md.
 */
export function FormulasPage() {
  const [query, setQuery] = useState('')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null)
  const favoritenIds = useAppStore((state) => state.favoritenIds)
  const toggleFavorit = useAppStore((state) => state.toggleFavorit)

  const filtered = useMemo(() => {
    return filterFormulas(FORMULA_CATALOG, query, {
      favoritesOnly,
      favoritenIds,
    })
  }, [query, favoritesOnly, favoritenIds])

  const groups = useMemo(() => {
    return FORMULA_CATEGORIES.map((category) => ({
      category,
      formulas: filtered.filter((formula) => formula.category === category),
    })).filter((group) => group.formulas.length > 0)
  }, [filtered])

  return (
    <div className="page">
      <h1>Formeln</h1>

      <div className="formulas-page__toolbar">
        <label className="formulas-page__search">
          <span className="formulas-page__search-label">Suche</span>
          <input
            type="search"
            placeholder="Formel nach Titel oder Beschreibung suchen"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="formulas-page__favorites-filter"
          aria-pressed={favoritesOnly}
          onClick={() => setFavoritesOnly((current) => !current)}
        >
          Nur Favoriten
        </button>
      </div>

      {groups.length === 0 ? (
        <p className="formulas-page__empty">
          {favoritesOnly
            ? 'Keine Favoriten vorhanden. Markiere Formeln mit dem Stern, damit sie hier erscheinen.'
            : 'Keine Formeln gefunden. Versuche einen anderen Suchbegriff.'}
        </p>
      ) : (
        groups.map((group) => (
          <section
            key={group.category}
            className="formulas-page__group"
            aria-labelledby={`formulas-page__group-${group.category}`}
          >
            <h2
              id={`formulas-page__group-${group.category}`}
              className="formulas-page__group-title"
            >
              {CATEGORY_LABELS[group.category]}
            </h2>
            <div className="formulas-page__cards">
              {group.formulas.map((formula) => {
                const isFavorit = favoritenIds.includes(formula.id)
                return (
                  <Card key={formula.id} className="formulas-page__card">
                    <div className="formulas-page__card-header">
                      <h3 className="formulas-page__card-title">
                        {formula.title}
                      </h3>
                      <button
                        type="button"
                        className="formulas-page__favorite-toggle"
                        aria-pressed={isFavorit}
                        aria-label={
                          isFavorit
                            ? `${formula.title} als Favorit entfernen`
                            : `${formula.title} als Favorit markieren`
                        }
                        onClick={() => toggleFavorit(formula.id)}
                      >
                        {isFavorit ? '★' : '☆'}
                      </button>
                    </div>
                    <p className="formulas-page__card-description">
                      {formula.description}
                    </p>
                    <p className="formulas-page__card-latex">{formula.latex}</p>
                    <button
                      type="button"
                      className="formulas-page__details-button"
                      aria-label={`Details zu ${formula.title} anzeigen`}
                      onClick={() => setSelectedFormula(formula)}
                    >
                      Details anzeigen
                    </button>
                  </Card>
                )
              })}
            </div>
          </section>
        ))
      )}

      {selectedFormula && (
        <FormulaDetail
          formula={selectedFormula}
          onClose={() => setSelectedFormula(null)}
        />
      )}
    </div>
  )
}
