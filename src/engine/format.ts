const SIGNIFICANT_DIGITS = 12

/**
 * Entfernt überflüssige Nachkommanullen (und ggf. den Dezimalpunkt) aus
 * einer Ziffernfolge ohne Exponent, z. B. "0.300000000000" -> "0.3".
 */
function stripTrailingZeros(digits: string): string {
  if (!digits.includes('.')) {
    return digits
  }
  const trimmed = digits.replace(/0+$/, '').replace(/\.$/, '')
  return trimmed === '' || trimmed === '-' ? '0' : trimmed
}

/**
 * Formatiert ein numerisches Engine-Ergebnis für die Anzeige.
 *
 * Strategie (siehe docs/engine.md, Abschnitt "Genauigkeit und
 * Formatierung"): Rundung auf 12 signifikante Stellen mittels
 * `toPrecision(12)`. Das behebt Fließkomma-Artefakte wie `0.1+0.2` (intern
 * `0.30000000000000004`), das als `0.3` ausgegeben wird.
 *
 * `toPrecision(12)` wechselt selbst in Exponentialschreibweise, sobald der
 * Exponent < -6 oder >= 12 ist - also für sehr große (Betrag >= 1e12) und
 * sehr kleine (Betrag < 1e-6) Werte. Diese Schwelle ergibt sich direkt aus
 * der 12-stelligen Genauigkeit: mehr als 12 Stellen vor dem Komma bzw. mehr
 * als 6 führende Nullen nach dem Komma lassen sich damit nicht mehr sinnvoll
 * darstellen.
 */
export function formatResult(value: number): string {
  if (value === 0) {
    return '0'
  }

  const precise = value.toPrecision(SIGNIFICANT_DIGITS)
  const exponentIndex = precise.indexOf('e')

  if (exponentIndex === -1) {
    return stripTrailingZeros(precise)
  }

  const mantissa = stripTrailingZeros(precise.slice(0, exponentIndex))
  const exponent = precise.slice(exponentIndex + 1).replace(/^\+/, '')
  return `${mantissa}e${exponent}`
}
