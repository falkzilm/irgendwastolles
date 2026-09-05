import { Button } from '../../ui/Button'
import type { VerlaufEintrag } from '../../store'
import './Verlauf.css'

interface VerlaufProps {
  verlauf: VerlaufEintrag[]
  onSelect: (expression: string) => void
  onClear: () => void
}

/**
 * Verlauf abgeschlossener Berechnungen (IRGENDWAST-26). Ein Klick auf einen
 * Eintrag übernimmt dessen Ausdruck ins Display, "Verlauf löschen" leert ihn
 * vollständig. Die Begrenzung auf `MAX_VERLAUF_EINTRAEGE` sowie die
 * Persistenz übernimmt `verlaufSlice`.
 */
export function Verlauf({ verlauf, onSelect, onClear }: VerlaufProps) {
  return (
    <div className="calculator-verlauf">
      <div className="calculator-verlauf__header">
        <h2 className="calculator-verlauf__title">Verlauf</h2>
        {verlauf.length > 0 && (
          <Button
            variant="secondary"
            className="calculator-verlauf__clear"
            onClick={onClear}
          >
            Verlauf löschen
          </Button>
        )}
      </div>
      {verlauf.length === 0 ? (
        <p className="calculator-verlauf__empty">
          Noch keine Berechnungen vorhanden. Abgeschlossene Berechnungen
          erscheinen hier.
        </p>
      ) : (
        <ul className="calculator-verlauf__list">
          {verlauf.map((eintrag) => (
            <li key={eintrag.id}>
              <button
                type="button"
                className="calculator-verlauf__eintrag"
                onClick={() => onSelect(eintrag.expression)}
              >
                <span className="calculator-verlauf__eintrag-ausdruck">
                  {eintrag.expression}
                </span>
                <span className="calculator-verlauf__eintrag-ergebnis">
                  = {eintrag.result}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
