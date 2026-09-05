import './Display.css'

interface DisplayProps {
  expression: string
  result: string | null
  error: string | null
}

/**
 * Zeigt den aktuell eingegebenen Ausdruck sowie darunter Ergebnis oder
 * Fehlermeldung. Fehler bekommen `role="alert"`, damit sie von
 * Screenreadern automatisch vorgelesen werden (IRGENDWAST-24).
 */
export function Display({ expression, result, error }: DisplayProps) {
  return (
    <div className="calculator-display">
      <div
        className="calculator-display__expression"
        role="group"
        aria-label="Ausdruck"
      >
        {expression || '0'}
      </div>
      <div
        className={
          error
            ? 'calculator-display__secondary calculator-display__secondary--error'
            : 'calculator-display__secondary'
        }
        role={error ? 'alert' : 'status'}
        aria-label={error ? undefined : 'Ergebnis'}
      >
        {error ?? result}
      </div>
    </div>
  )
}
